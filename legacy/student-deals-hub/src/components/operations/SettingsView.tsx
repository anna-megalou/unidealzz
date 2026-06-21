import { useEffect, useState } from "react";
import { Bell, Lock, User, Globe, Mail, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
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

      const [{ data: profile }, { data: settings }, { data: roleRow }] = await Promise.all([
        supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id).order("created_at", { ascending: true }).limit(1).maybeSingle(),
      ]);

      if (cancelled) return;
      setFullName(profile?.display_name ?? "");
      setRole(roleRow?.role ?? "");
      if (settings) {
        setPrefs({
          phone: settings.phone ?? "",
          language: settings.language ?? "en",
          timezone: settings.timezone ?? "europe-athens",
          currency: settings.currency ?? "eur",
          theme: settings.theme ?? "light",
          email_notifications: settings.email_notifications,
          push_notifications: settings.push_notifications,
          security_alerts: settings.security_alerts,
        });
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const upsertSettings = async (patch: Partial<Prefs>) => {
    if (!user) return;
    const next = { ...prefs, ...patch };
    setPrefs(next);
    const { error } = await supabase
      .from("user_settings")
      .upsert({ user_id: user.id, ...next }, { onConflict: "user_id" });
    if (error) {
      toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      const { error: pErr } = await supabase
        .from("profiles")
        .upsert({ user_id: user.id, display_name: fullName }, { onConflict: "user_id" });
      if (pErr) throw pErr;

      const { error: sErr } = await supabase
        .from("user_settings")
        .upsert({ user_id: user.id, ...prefs, phone: prefs.phone }, { onConflict: "user_id" });
      if (sErr) throw sErr;

      toast({ title: "Profile saved" });
      logActivity({
        action: "settings.updated",
        summary: "Updated profile & preferences",
        entity: "user_settings",
        entityId: user.id,
      });
    } catch (e: any) {
      toast({ title: "Couldn't save profile", description: e.message, variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePrefs = async () => {
    setSavingPrefs(true);
    await upsertSettings({});
    setSavingPrefs(false);
    toast({ title: "Preferences saved" });
  };

  const handleUpdateSecurity = async () => {
    if (!newPassword) {
      toast({ title: "Enter a new password", variant: "destructive" });
      return;
    }
    setSavingSecurity(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingSecurity(false);
    if (error) {
      toast({ title: "Couldn't update password", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated" });
      logActivity({
        action: "security.password_updated",
        summary: "Updated account password",
        entity: "auth",
      });
      setCurrentPassword("");
      setNewPassword("");
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
