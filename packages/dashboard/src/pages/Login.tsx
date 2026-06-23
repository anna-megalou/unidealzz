import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import Footer from "@/components/home/Footer";
import { toast } from "sonner";
import { ArrowRight, ShieldCheck, Shield, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import logo from "@/assets/logo.png";

const Login = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { signIn, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t("login.error.fillAll"));
      return;
    }
    setSubmitting(true);
    try {
      await signIn(email, password);
      toast.success(t("login.success"));
      navigate("/student-hub");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      if (message.toLowerCase().includes("invalid")) toast.error(t("login.error.invalid"));
      else if (message.toLowerCase().includes("not confirmed")) toast.error(t("login.error.notConfirmed"));
      else toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error(t("login.forgot.enterEmail"));
      return;
    }
    try {
      await resetPassword(email);
      toast.success(t("login.forgot.sent"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send reset email");
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(0deg, #FCF8FE, #FCF8FE), hsl(var(--background))" }}>
      <Navbar />

      <div className="container flex flex-1 flex-col items-center py-12 md:py-16">
        <div className="w-full max-w-md rounded-2xl border border-border/50 bg-card p-8 shadow-lg">
          <div className="mb-6 flex justify-center">
            <img src={logo} alt="Unidealz" className="h-14 w-14 rounded-xl shadow-sm" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl text-center">{t("login.title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground text-center">{t("login.subtitle")}</p>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("login.email")}</Label>
              <Input id="email" type="email" placeholder={t("login.emailPlaceholder")} value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl border-border/60 bg-muted/30 text-sm" required />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("login.password")}</Label>
                <button type="button" onClick={handleForgotPassword} className="text-xs font-medium text-primary hover:underline">{t("login.forgot")}</button>
              </div>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder={t("login.passwordPlaceholder")} value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-xl border-border/60 bg-muted/30 text-sm pr-11" required />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={submitting} className="h-12 w-full rounded-xl bg-primary font-display text-base font-semibold">
              {submitting ? t("login.submitting") : t("login.submit")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {t("login.noAccount")}{" "}
            <Link to="/signup" className="font-semibold text-primary hover:underline">{t("login.signupLink")}</Link>
          </p>

          <p className="mt-6 rounded-xl bg-muted/40 p-4 text-center text-xs text-muted-foreground">
            {t("login.note")}
          </p>
        </div>

        <div className="mt-8 flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <div className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" />{t("login.badge.secure")}</div>
          <div className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-muted-foreground" />{t("login.badge.protected")}</div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Login;
