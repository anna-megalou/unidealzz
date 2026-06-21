import { useEffect, useState } from "react";
import { z } from "zod";
import StudentHubLayout from "@/components/student-hub/StudentHubLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const profileSchema = z.object({
  first: z.string().trim().min(1, "First name is required").max(60),
  last: z.string().trim().max(60).optional(),
  university: z.string().uuid().optional().or(z.literal("")),
  graduation: z.string().trim().max(40).optional(),
});

interface University {
  id: string;
  name: string;
}

const Account = () => {
  const { user } = useAuth();

  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [universityId, setUniversityId] = useState<string>("");
  const [graduation, setGraduation] = useState("");

  const [universities, setUniversities] = useState<University[]>([]);
  const [verification, setVerification] = useState<{
    status: "pending" | "approved" | "rejected" | null;
    verifiedAt: string | null;
  }>({ status: null, verifiedAt: null });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    setEmail(user.email ?? "");

    (async () => {
      const [profileRes, studentRes, uniRes] = await Promise.all([
        supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle(),
        supabase
          .from("student_profiles")
          .select("university_id, expected_graduation, verification_status, verified_at")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase.from("universities").select("id, name").order("name"),
      ]);

      if (cancelled) return;

      const fullName =
        profileRes.data?.display_name ??
        (user.user_metadata?.display_name as string | undefined) ??
        (user.email ? user.email.split("@")[0] : "");
      const [f, ...rest] = fullName.split(" ");
      setFirst(f ?? "");
      setLast(rest.join(" "));

      if (studentRes.data) {
        setUniversityId(studentRes.data.university_id ?? "");
        setGraduation((studentRes.data as any).expected_graduation ?? "");
        setVerification({
          status: studentRes.data.verification_status,
          verifiedAt: studentRes.data.verified_at,
        });
      }

      setUniversities(uniRes.data ?? []);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    const parsed = profileSchema.safeParse({
      first,
      last,
      university: universityId,
      graduation,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setSaving(true);
    const fullName = [first.trim(), last.trim()].filter(Boolean).join(" ");

    // Upsert profile name
    const { error: profileErr } = await supabase
      .from("profiles")
      .update({ display_name: fullName })
      .eq("user_id", user.id);

    // Upsert student profile (university + graduation)
    const { data: existing } = await supabase
      .from("student_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    let studentErr = null as any;
    if (existing) {
      const { error } = await supabase
        .from("student_profiles")
        .update({
          university_id: universityId || null,
          expected_graduation: graduation || null,
        } as any)
        .eq("user_id", user.id);
      studentErr = error;
    } else {
      const { error } = await supabase.from("student_profiles").insert({
        user_id: user.id,
        university_id: universityId || null,
        expected_graduation: graduation || null,
      } as any);
      studentErr = error;
    }

    setSaving(false);

    if (profileErr || studentErr) {
      toast.error("Couldn't save your changes");
    } else {
      toast.success("Profile updated");
    }
  };



  const membershipLabel =
    verification.status === "approved"
      ? "Verified Student — Elite Member"
      : verification.status === "pending"
        ? "Verification Pending"
        : verification.status === "rejected"
          ? "Verification Rejected"
          : "Not Verified";

  const membershipMeta = verification.verifiedAt
    ? `Verified on ${new Date(verification.verifiedAt).toLocaleDateString()}`
    : "Submit your student email to unlock Elite benefits.";

  return (
    <StudentHubLayout>
      <header className="mb-8">
        <h1 className="font-display text-4xl font-bold text-foreground">Account</h1>
        <p className="mt-2 text-muted-foreground">Manage your personal information and preferences.</p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-2xl bg-card p-6 ring-1 ring-border lg:col-span-2">
          <h2 className="font-display text-xl font-bold text-foreground">Profile</h2>
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <Label htmlFor="first">First name</Label>
              <Input
                id="first"
                value={first}
                onChange={(e) => setFirst(e.target.value)}
                disabled={loading}
                className="mt-1.5"
                maxLength={60}
              />
            </div>
            <div>
              <Label htmlFor="last">Last name</Label>
              <Input
                id="last"
                value={last}
                onChange={(e) => setLast(e.target.value)}
                disabled={loading}
                className="mt-1.5"
                maxLength={60}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} readOnly className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="uni">University</Label>
              <Select
                value={universityId || undefined}
                onValueChange={setUniversityId}
                disabled={loading}
              >
                <SelectTrigger id="uni" className="mt-1.5">
                  <SelectValue placeholder="Select your university" />
                </SelectTrigger>
                <SelectContent>
                  {universities.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="grad">Expected graduation</Label>
              <Input
                id="grad"
                value={graduation}
                onChange={(e) => setGraduation(e.target.value)}
                disabled={loading}
                className="mt-1.5"
                placeholder="e.g. May 2026"
                maxLength={40}
              />
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={loading || saving}
            className="mt-6 rounded-full font-semibold"
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl bg-muted/60 p-6">
            <h3 className="font-display text-lg font-bold text-foreground">Membership</h3>
            <p className="mt-2 text-sm text-muted-foreground">{membershipLabel}</p>
            <p className="mt-1 text-xs text-muted-foreground">{membershipMeta}</p>
            <Button variant="secondary" className="mt-4 w-full rounded-full font-semibold text-primary">
              Manage Plan
            </Button>
          </div>
        </aside>
      </div>
    </StudentHubLayout>
  );
};

export default Account;
