import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import Footer from "@/components/home/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase places a recovery session in the URL hash; getSession handles it.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast.error("Reset link is invalid or expired.");
        navigate("/login");
        return;
      }
      setReady(true);
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (password !== confirm) return toast.error("Passwords do not match");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return toast.error(error.message);
    toast.success("Password updated. Please log in.");
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(0deg, #FCF8FE, #FCF8FE), hsl(var(--background))" }}>
      <Navbar />
      <div className="container flex flex-1 flex-col items-center py-16">
        <div className="w-full max-w-md rounded-2xl border border-border/50 bg-card p-8 shadow-lg">
          <h1 className="font-display text-2xl font-bold text-foreground">Reset password</h1>
          <p className="mt-2 text-sm text-muted-foreground">Choose a new password for your account.</p>
          {ready && (
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="space-y-2">
                <Label>New password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Confirm password</Label>
                <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required className="h-12 rounded-xl" />
              </div>
              <Button type="submit" className="h-12 w-full rounded-xl">Update password</Button>
            </form>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ResetPassword;
