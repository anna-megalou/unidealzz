import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { getUserSettings, updateUserSettings } from "@/lib/firestoreData";
import { toast } from "sonner";

const ChangeInitialPasswordDialog = () => {
  const { user, updateUserPassword } = useAuth();
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const settings = await getUserSettings(user.uid);
      if (settings?.mustChangePassword === true) setOpen(true);
    })();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (password !== confirm) return toast.error("Passwords do not match");
    if (!user) return;

    setSubmitting(true);
    try {
      await updateUserPassword(password);
      const existing = (await getUserSettings(user.uid)) ?? {};
      await updateUserSettings(user.uid, { ...existing, mustChangePassword: false });
      toast.success("Password updated successfully");
      setOpen(false);
      setShowForm(false);
      setPassword("");
      setConfirm("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Couldn't update password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <AlertDialogTitle className="text-center">
            Change your initial password
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            For security reasons, we recommend updating the password you set
            during your invitation before continuing.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {showForm ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>New password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
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
              />
            </div>
            <AlertDialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                disabled={submitting}
              >
                Back
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Updating...</>
                ) : (
                  "Update password"
                )}
              </Button>
            </AlertDialogFooter>
          </form>
        ) : (
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Later
            </Button>
            <Button onClick={() => setShowForm(true)}>
              Change Password Now
            </Button>
          </AlertDialogFooter>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ChangeInitialPasswordDialog;
