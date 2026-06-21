import { useEffect, useState } from "react";
import { Loader2, Star, Upload, X } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { createExperiencePost } from "@/lib/experienceApi";
import { fetchBrands, fetchCategories } from "@/lib/firestoreData";
import { cn } from "@/lib/utils";

const MAX_IMAGES = 4;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const schema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(120),
  content: z.string().trim().min(10, "Tell us a bit more (10+ chars)").max(2000),
  rating: z.number().int().min(0).max(5),
  brandId: z.string().nullable(),
  categoryId: z.string().nullable(),
  wouldRecommend: z.boolean(),
  savings: z.string().max(20).optional(),
  location: z.string().max(120).optional(),
});

interface BrandOption {
  id: string;
  name: string;
}
interface CategoryOption {
  id: string;
  name: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPosted: () => void;
}

export const ExperienceComposer = ({ open, onOpenChange, onPosted }: Props) => {
  const { user } = useAuth();
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(0);
  const [brandId, setBrandId] = useState<string>("none");
  const [categoryId, setCategoryId] = useState<string>("none");
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [savings, setSavings] = useState("");
  const [location, setLocation] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const [b, c] = await Promise.all([fetchBrands(true), fetchCategories()]);
      setBrands(b.map((row) => ({ id: row.id, name: row.name })));
      setCategories(c.map((row) => ({ id: row.id, name: row.name })));
    })();
  }, [open]);

  const reset = () => {
    setTitle("");
    setContent("");
    setRating(0);
    setBrandId("none");
    setCategoryId("none");
    setWouldRecommend(true);
    setSavings("");
    setLocation("");
    setFiles([]);
  };

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list);
    const valid: File[] = [];
    for (const f of incoming) {
      if (!f.type.startsWith("image/")) {
        toast.error(`${f.name} is not an image`);
        continue;
      }
      if (f.size > MAX_IMAGE_BYTES) {
        toast.error(`${f.name} exceeds 5MB`);
        continue;
      }
      valid.push(f);
    }
    setFiles((prev) => [...prev, ...valid].slice(0, MAX_IMAGES));
  };

  const removeFile = (idx: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please sign in to post");
      return;
    }
    const parsed = schema.safeParse({
      title,
      content,
      rating,
      brandId: brandId === "none" ? null : brandId,
      categoryId: categoryId === "none" ? null : categoryId,
      wouldRecommend,
      savings,
      location,
    });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? "Please check the form");
      return;
    }

    setSubmitting(true);
    try {
      await createExperiencePost({
        userId: user.uid,
        title: parsed.data.title,
        content: parsed.data.content,
        brandId: parsed.data.brandId,
        categoryId: parsed.data.categoryId,
        rating: parsed.data.rating,
        wouldRecommend: parsed.data.wouldRecommend,
        savings,
        location,
        files,
      });

      toast.success("Experience shared!");
      reset();
      onOpenChange(false);
      onPosted();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not publish your post");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && onOpenChange(v)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Post Your Experience</DialogTitle>
          <DialogDescription>
            Share a deal you loved with the Unidealz community.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="exp-title">Title *</Label>
            <Input
              id="exp-title"
              placeholder="Best coffee deal on campus"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="exp-content">Your story *</Label>
            <Textarea
              id="exp-content"
              placeholder="Tell us how it went, what you got, and why it was worth it…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              maxLength={2000}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Brand</Label>
              <Select value={brandId} onValueChange={setBrandId}>
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No brand</SelectItem>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Rating</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(rating === n ? 0 : n)}
                  className="rounded-md p-1 transition-colors hover:bg-muted"
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                >
                  <Star
                    size={22}
                    className={cn(
                      "transition-colors",
                      n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground",
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="exp-savings">Savings (€)</Label>
              <Input
                id="exp-savings"
                placeholder="e.g. 12.50"
                inputMode="decimal"
                value={savings}
                onChange={(e) => setSavings(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-loc">Location</Label>
              <Input
                id="exp-loc"
                placeholder="e.g. Athens · Kolonaki"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={120}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border bg-muted/40 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Would recommend</p>
              <p className="text-xs text-muted-foreground">Let others know if it's worth it</p>
            </div>
            <Switch checked={wouldRecommend} onCheckedChange={setWouldRecommend} />
          </div>

          <div className="space-y-2">
            <Label>Photos (up to {MAX_IMAGES})</Label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-muted/30 px-4 py-6 text-sm text-muted-foreground hover:bg-muted/50">
              <Upload size={16} />
              <span>Click to upload images</span>
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                  handleFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
            {files.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {files.map((f, i) => (
                  <div key={i} className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                    <img
                      src={URL.createObjectURL(f)}
                      alt={f.name}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute right-1 top-1 rounded-full bg-foreground/70 p-1 text-background hover:bg-foreground"
                      aria-label="Remove"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} className="rounded-full font-semibold">
            {submitting && <Loader2 className="animate-spin" size={16} />}
            {submitting ? "Posting…" : "Post Experience"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
