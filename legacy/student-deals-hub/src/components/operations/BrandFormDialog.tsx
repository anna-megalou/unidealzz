import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activityLog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, X } from "lucide-react";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

const brandSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required")
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and dashes"),
  website: z.string().trim().url("Must be a valid URL").max(255).optional().or(z.literal("")),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  logo_url: z.string().trim().url("Must be a valid URL").max(500).optional().or(z.literal("")),
});

const MAX_LOGO_BYTES = 3 * 1024 * 1024; // 3MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

export type BrandRecord = {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  description: string | null;
  logo_url: string | null;
};

interface BrandFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  brand?: BrandRecord | null; // when present => edit mode
}

const BrandFormDialog = ({ open, onOpenChange, onSaved, brand }: BrandFormDialogProps) => {
  const isEdit = !!brand;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Initialise / reset when opened
  useEffect(() => {
    if (open) {
      setName(brand?.name ?? "");
      setSlug(brand?.slug ?? "");
      setSlugTouched(isEdit);
      setWebsite(brand?.website ?? "");
      setDescription(brand?.description ?? "");
      setLogoUrl(brand?.logo_url ?? "");
      setFile(null);
      setFilePreview(null);
    }
  }, [open, brand, isEdit]);

  // Auto-slug from name (add mode only, until user edits slug)
  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  // Build object preview URL for selected file
  useEffect(() => {
    if (!file) {
      setFilePreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setFilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleClose = (next: boolean) => {
    if (submitting) return;
    onOpenChange(next);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) {
      setFile(null);
      return;
    }
    if (!ALLOWED_TYPES.includes(f.type)) {
      toast.error("Logo must be PNG, JPG, WebP, or SVG");
      e.target.value = "";
      return;
    }
    if (f.size > MAX_LOGO_BYTES) {
      toast.error("Logo must be under 3MB");
      e.target.value = "";
      return;
    }
    setFile(f);
  };

  const uploadLogo = async (brandSlug: string): Promise<string> => {
    if (!file) return "";
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${brandSlug}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("brand-logos")
      .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
    if (upErr) throw upErr;
    const { data } = supabase.storage.from("brand-logos").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = brandSchema.safeParse({ name, slug, website, description, logo_url: logoUrl });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setSubmitting(true);
    try {
      // Duplicate pre-check (skip current row in edit mode)
      let dupQuery = supabase
        .from("brands")
        .select("id,name,slug")
        .or(`name.ilike.${parsed.data.name},slug.eq.${parsed.data.slug}`)
        .limit(2);
      const { data: existing } = await dupQuery;
      const conflict = (existing ?? []).find((row) => row.id !== brand?.id);
      if (conflict) {
        toast.error("A brand with this name or slug already exists");
        return;
      }

      // Upload file (if provided) — overrides URL field
      let finalLogoUrl = parsed.data.logo_url || null;
      if (file) {
        try {
          finalLogoUrl = await uploadLogo(parsed.data.slug);
        } catch (err: any) {
          toast.error(err?.message?.includes("row-level") ? "Only admins can upload logos" : err?.message ?? "Upload failed");
          return;
        }
      }

      const payload = {
        name: parsed.data.name,
        slug: parsed.data.slug,
        website: parsed.data.website || null,
        description: parsed.data.description || null,
        logo_url: finalLogoUrl,
      };

      const result = isEdit
        ? await supabase.from("brands").update(payload).eq("id", brand!.id).select("id").maybeSingle()
        : await supabase.from("brands").insert(payload).select("id").maybeSingle();
      const { data: savedRow, error } = result;

      if (error) {
        if (error.code === "23505") {
          toast.error("A brand with this name or slug already exists");
        } else if (error.code === "42501" || error.message.toLowerCase().includes("row-level")) {
          toast.error("Only admins can manage brands");
        } else {
          toast.error(error.message);
        }
        return;
      }

      const brandId = (savedRow as any)?.id ?? brand?.id ?? null;
      logActivity({
        action: isEdit ? "brand.edited" : "brand.created",
        summary: isEdit
          ? `Edited brand "${parsed.data.name}"`
          : `Created brand "${parsed.data.name}"`,
        entity: "brand",
        entityId: brandId,
        metadata: { slug: parsed.data.slug },
      });

      toast.success(isEdit ? `Brand "${parsed.data.name}" updated` : `Brand "${parsed.data.name}" created`);
      onSaved();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  const previewUrl = filePreview || logoUrl || null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-extrabold">
            {isEdit ? "Edit Brand" : "Add New Brand"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update brand details. Changes appear immediately in the list."
              : "Create a new brand partner. It will appear immediately in the brand list."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="brand-name">Brand name *</Label>
            <Input
              id="brand-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Nike"
              maxLength={80}
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand-slug">Slug *</Label>
            <Input
              id="brand-slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              placeholder="e.g. nike"
              maxLength={80}
              required
            />
            {!isEdit && <p className="text-xs text-muted-foreground">Auto-generated from name. Editable.</p>}
          </div>

          {/* Logo: upload OR URL */}
          <div className="space-y-2">
            <Label>Brand logo</Label>
            <div className="flex items-start gap-3">
              <div className="h-20 w-20 rounded-xl border border-border bg-muted overflow-hidden flex items-center justify-center shrink-0">
                {previewUrl ? (
                  <img src={previewUrl} alt="Logo preview" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-muted-foreground">No logo</span>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full"
                  >
                    <Upload className="h-4 w-4 mr-1.5" />
                    {file ? "Replace file" : "Upload file"}
                  </Button>
                  {file && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="rounded-full"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
                {file && <p className="text-xs text-muted-foreground truncate">{file.name}</p>}
                <p className="text-xs text-muted-foreground">PNG, JPG, WebP or SVG. Max 3MB.</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand-logo-url">…or paste a logo URL</Label>
            <Input
              id="brand-logo-url"
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://..."
              maxLength={500}
              disabled={!!file}
            />
            {file && (
              <p className="text-xs text-muted-foreground">
                URL is ignored while a file is selected — uploaded file wins.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand-website">Website</Label>
            <Input
              id="brand-website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
              maxLength={255}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand-description">Description</Label>
            <Textarea
              id="brand-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description of the brand"
              maxLength={500}
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleClose(false)}
              disabled={submitting}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="rounded-full font-display font-semibold"
              style={{ background: "linear-gradient(135deg, #7073FF 0%, #842CD3 100%)" }}
            >
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {submitting ? (isEdit ? "Saving..." : "Creating...") : isEdit ? "Save Changes" : "Create Brand"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BrandFormDialog;
