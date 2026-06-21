import { useEffect, useState } from "react";
import { Bell, Lock, User, Globe, Mail, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { getUserDisplaySettings, updateStaffSettings } from "@/lib/operationsApi";
import { toast } from "@/hooks/use-toast";
import { logActivity } from "@/lib/activityLog";

type Prefs = {
  phone: string;
  language: string;
  timezone: string;
  currency: string;
  theme: string;
  email_notifications: boolean;
  push_notifications: boolean;
  security_alerts: boolean;
};

const DEFAULTS: Prefs = {
  phone: "",
  language: "en",
  timezone: "europe-athens",
  currency: "eur",
  theme: "light",
  email_notifications: true,
  push_notifications: true,
  security_alerts: true,
};

const SettingsView = () => {
  const { user, roles, updateUserPassword } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);

  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setEmail(user.email ?? "");

      const [{ display_name, settings }] = await Promise.all([
        getUserDisplaySettings(user.uid),
      ]);

      if (cancelled) return;
      setFullName(display_name ?? "");
      setRole(roles[0] ?? "");
      if (settings) {
        setPrefs({
          phone: String(settings.phone ?? ""),
          language: String(settings.language ?? "en"),
          timezone: String(settings.timezone ?? "europe-athens"),
          currency: String(settings.currency ?? "eur"),
          theme: String(settings.theme ?? "light"),
          email_notifications: Boolean(settings.email_notifications ?? settings.emailNotifications ?? true),
          push_notifications: Boolean(settings.push_notifications ?? settings.pushNotifications ?? true),
          security_alerts: Boolean(settings.security_alerts ?? settings.securityAlerts ?? true),
        });
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, roles]);

  const upsertSettings = async (patch: Partial<Prefs>) => {
    if (!user) return;
    const next = { ...prefs, ...patch };
    setPrefs(next);
    try {
      await updateStaffSettings(user.uid, next, fullName);
    } catch (e: unknown) {
      toast({
        title: "Couldn't save",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      await updateStaffSettings(user.uid, prefs, fullName);
      toast({ title: "Profile saved" });
      logActivity({
        action: "settings.updated",
        summary: "Updated profile & preferences",
        entity: "user_settings",
        entityId: user.uid,
      });
    } catch (e: unknown) {
      toast({
        title: "Couldn't save profile",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdateSecurity = async () => {
    if (!newPassword) {
      toast({ title: "Enter a new password", variant: "destructive" });
      return;
    }
    setSavingSecurity(true);
    try {
      await updateUserPassword(newPassword);
      toast({ title: "Password updated" });
      logActivity({
        action: "security.password_updated",
        summary: "Updated account password",
        entity: "auth",
      });
      setCurrentPassword("");
      setNewPassword("");
    } catch (e: unknown) {
      toast({
        title: "Couldn't update password",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSavingSecurity(false);
    }
  };

  return (
    <main className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-extrabold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account, preferences, and security.
        </p>
      </header>

      {/* Profile */}
      <section className="rounded-3xl bg-card p-6 ring-1 ring-border">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-bold text-foreground">Profile</h2>
        </div>
        <Separator className="my-5" />
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input id="role" value={role} disabled readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} disabled readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={prefs.phone}
              onChange={(e) => setPrefs((p) => ({ ...p, phone: e.target.value }))}
              disabled={loading}
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button className="rounded-full font-semibold" onClick={handleSaveProfile} disabled={loading || savingProfile}>
            {savingProfile ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </section>

      {/* Preferences */}
      <section className="rounded-3xl bg-card p-6 ring-1 ring-border">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-bold text-foreground">Preferences</h2>
        </div>
        <Separator className="my-5" />
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Language</Label>
            <Select value={prefs.language} onValueChange={(v) => upsertSettings({ language: v })} disabled={loading}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="el">Ελληνικά</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select value={prefs.timezone} onValueChange={(v) => upsertSettings({ timezone: v })} disabled={loading}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="europe-athens">Europe/Athens (GMT+3)</SelectItem>
                <SelectItem value="europe-london">Europe/London (GMT+1)</SelectItem>
                <SelectItem value="utc">UTC</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select value={prefs.currency} onValueChange={(v) => upsertSettings({ currency: v })} disabled={loading}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="eur">EUR (€)</SelectItem>
                <SelectItem value="usd">USD ($)</SelectItem>
                <SelectItem value="gbp">GBP (£)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Theme</Label>
            <Select value={prefs.theme} onValueChange={(v) => upsertSettings({ theme: v })} disabled={loading}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="rounded-3xl bg-card p-6 ring-1 ring-border">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-bold text-foreground">Notifications</h2>
        </div>
        <Separator className="my-5" />
        <div className="space-y-5">
          {([
            { key: "email_notifications" as const, icon: Mail, title: "Email notifications", desc: "Get product updates and weekly summaries." },
            { key: "push_notifications" as const, icon: Bell, title: "Push notifications", desc: "Real-time alerts for new redemptions and brands." },
            { key: "security_alerts" as const, icon: Shield, title: "Security alerts", desc: "Be notified about new sign-ins and security events." },
          ]).map((n) => (
            <div key={n.title} className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <n.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.desc}</p>
                </div>
              </div>
              <Switch
                checked={prefs[n.key]}
                onCheckedChange={(v) => upsertSettings({ [n.key]: v } as Partial<Prefs>)}
                disabled={loading}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Security */}
      <section className="rounded-3xl bg-card p-6 ring-1 ring-border">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-bold text-foreground">Security</h2>
        </div>
        <Separator className="my-5" />
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl bg-muted/50 p-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Two-factor authentication</p>
            <p className="text-xs text-muted-foreground">Add an extra layer of security to your account.</p>
          </div>
          <Switch disabled />
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Button variant="outline" className="rounded-full font-semibold text-destructive hover:text-destructive" disabled>
            Delete account
          </Button>
          <Button className="rounded-full font-semibold" onClick={handleUpdateSecurity} disabled={savingSecurity}>
            {savingSecurity ? "Updating…" : "Update security"}
          </Button>
        </div>
      </section>
    </main>
  );
};

export default SettingsView;
