import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import Footer from "@/components/home/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AcceptInvite = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // The invite/magic link drops a session in the URL hash; getSession resolves it.
    let mounted = true;
    (async () => {
      // Give Supabase a tick to parse the hash
      await new Promise((r) => setTimeout(r, 50));
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!session?.user) {
        toast.error("This invite link is invalid or has expired.");
        navigate("/login");
        return;
      }
      setEmail(session.user.email ?? null);
      setReady(true);
      setChecking(false);
    })();
    return () => { mounted = false; };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (password !== confirm) return toast.error("Passwords do not match");

    setSubmitting(true);
    // 1. Set the password on the freshly invited account, and clear the
    //    "must_change_password" flag so the warning popup doesn't appear later.
    const { error: pwErr } = await supabase.auth.updateUser({
      password,
      data: { must_change_password: false },
    });
    if (pwErr) {
      setSubmitting(false);
      return toast.error(pwErr.message);
    }

    // 2. Promote the pending invite into a real role
    const { data, error } = await supabase.functions.invoke("accept-team-invite", { body: {} });
    if (error || (data as any)?.error) {
      setSubmitting(false);
      return toast.error((data as any)?.error ?? error?.message ?? "Could not activate your account");
    }

    toast.success("Welcome aboard! Your account is ready.");
    setSubmitting(false);
    navigate("/operations");
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(0deg, #FCF8FE, #FCF8FE), hsl(var(--background))" }}>
      <Navbar />
      <div className="container flex flex-1 flex-col items-center py-16">
        <div className="w-full max-w-md rounded-2xl border border-border/50 bg-card p-8 shadow-lg">
          <h1 className="font-display text-2xl font-bold text-foreground">Activate your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {email ? `Signed in as ${email}. ` : ""}Set a password to finish joining the team.
          </p>

          {checking && (
            <div className="mt-8 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Verifying invite...
            </div>
          )}

          {ready && (
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="space-y-2">
                <Label>New password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Confirm password</Label>
                <Input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={8}
                  className="h-12 rounded-xl"
                />
              </div>
              <Button type="submit" disabled={submitting} className="h-12 w-full rounded-xl">
                {submitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Activating...</>
                ) : (
                  "Set password & continue"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AcceptInvite;
