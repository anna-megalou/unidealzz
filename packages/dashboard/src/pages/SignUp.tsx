import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import Footer from "@/components/home/Footer";
import { toast } from "sonner";
import { callSignUpStudent, callSubmitStudentVerification } from "@/lib/firebase";
import { useUniversities } from "@/hooks/useOffers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MailCheck, Eye, EyeOff } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/hooks/useLanguage";
import signupHero from "@/assets/signup-hero.png";

const SignUp = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { data: universities = [] } = useUniversities();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [universityId, setUniversityId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [academicId, setAcademicId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(true);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [signedUpEmail, setSignedUpEmail] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password || !confirmPassword || !academicId) {
      toast.error(t("signup.error.fillAll"));
      return;
    }
    if (!/^\d{12}$/.test(academicId)) {
      toast.error(t("signup.error.idDigits"));
      return;
    }
    if (password !== confirmPassword) {
      toast.error(t("signup.error.passwordMatch"));
      return;
    }
    if (password.length < 8) {
      toast.error(t("signup.error.passwordLength"));
      return;
    }

    // Validate that the student email belongs to the selected university's domain
    // (supports subdomains, e.g. stt19238@stt.aegean.gr matches aegean.gr)
    if (universityId) {
      const uni = universities.find((u) => u.id === universityId);
      const emailDomain = email.split("@")[1]?.toLowerCase().trim();
      if (!emailDomain) {
        toast.error(t("signup.error.invalidEmail"));
        return;
      }
      const allowed = (uni?.allowed_domains ?? []).map((d) => d.toLowerCase());
      const matches = allowed.some(
        (d) => emailDomain === d || emailDomain.endsWith(`.${d}`)
      );
      if (allowed.length > 0 && !matches) {
        toast.error(
          t("signup.error.emailDomain")
            .replace("{uni}", uni?.name ?? "")
            .replace("{domains}", allowed.join(", "))
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      await callSignUpStudent({
        firstName,
        lastName,
        email,
        password,
        universityId,
        academicId,
        marketingOptIn,
      });

      if (universityId) {
        try {
          await callSubmitStudentVerification({ universityId, studentEmail: email });
        } catch {
          // Non-blocking
        }
      }

      setSignedUpEmail(email);
      setVerifyDialogOpen(true);
      toast.success(t("signup.success"));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sign up failed";
      if (message.toLowerCase().includes("already")) {
        toast.error(t("signup.error.exists"));
      } else {
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyDialogClose = () => {
    setVerifyDialogOpen(false);
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(0deg, #FCF8FE, #FCF8FE), #FFFFFF" }}>
      <Navbar />

      <div className="container flex-1 py-12 md:py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-start">
          <div className="flex flex-col gap-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-4">
                {t("signup.eyebrow")}
              </p>
              <h1 className="font-display text-4xl font-extrabold leading-tight text-foreground md:text-5xl lg:text-6xl">
                {t("signup.titleA")} <span className="text-primary">{t("signup.titleB")}</span>
                <br />
                {t("signup.titleC")}
              </h1>
              <p className="mt-6 max-w-md text-base text-muted-foreground leading-relaxed">
                {t("signup.subtitle")}
              </p>
            </div>

            <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border/50 bg-muted/30">
              <img
                src={signupHero}
                alt={t("signup.cardImage.alt")}
                className="aspect-square w-full object-cover"
              />
            </div>
          </div>

          <div className="w-full max-w-lg rounded-2xl border border-border/50 bg-card p-8 shadow-lg lg:ml-auto">
            <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
              {t("signup.formTitle")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("signup.haveAccount")}{" "}
              <Link to="/login" className="font-semibold text-foreground hover:underline">
                {t("signup.loginLink")}
              </Link>
            </p>

            <form onSubmit={handleSignUp} className="mt-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("signup.firstName")}</Label>
                  <Input placeholder={t("signup.firstNamePlaceholder")} value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-12 rounded-xl border-border/60 bg-muted/30 text-sm" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("signup.lastName")}</Label>
                  <Input placeholder={t("signup.lastNamePlaceholder")} value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-12 rounded-xl border-border/60 bg-muted/30 text-sm" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("signup.university")}</Label>
                <Select value={universityId} onValueChange={setUniversityId}>
                  <SelectTrigger className="h-12 rounded-xl border-border/60 bg-muted/30 text-sm">
                    <SelectValue placeholder={t("signup.universityPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {universities.map((uni) => (
                      <SelectItem key={uni.id} value={uni.id}>{uni.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("signup.academicId")}</Label>
                <Input
                  inputMode="numeric"
                  pattern="\d{12}"
                  minLength={12}
                  maxLength={12}
                  placeholder={t("signup.academicIdPlaceholder")}
                  value={academicId}
                  onChange={(e) => setAcademicId(e.target.value.replace(/\D/g, "").slice(0, 12))}
                  title={t("signup.academicIdTitle")}
                  className="h-12 rounded-xl border-border/60 bg-muted/30 text-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("signup.email")}</Label>
                <Input type="email" placeholder={t("signup.emailPlaceholder")} value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl border-border/60 bg-muted/30 text-sm" required />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("signup.password")}</Label>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-xl border-border/60 bg-muted/30 text-sm pr-11" required />
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

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("signup.confirmPassword")}</Label>
                <div className="relative">
                  <Input type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-12 rounded-xl border-border/60 bg-muted/30 text-sm pr-11" required />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <label className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 p-4 cursor-pointer">
                <Checkbox
                  checked={marketingOptIn}
                  onCheckedChange={(v) => setMarketingOptIn(v === true)}
                  className="mt-0.5"
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  {t("signup.marketingOptIn")}
                </span>
              </label>

              <Button type="submit" disabled={submitting} className="h-12 w-full rounded-xl bg-primary font-display text-base font-semibold">
                {submitting ? t("signup.submitting") : t("signup.submit")}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              {t("signup.terms")}{" "}
              <a href="#" className="text-primary hover:underline">{t("signup.termsLink")}</a> {t("signup.and")}{" "}
              <a href="#" className="text-primary hover:underline">{t("signup.privacyLink")}</a>.
            </p>
          </div>
        </div>
      </div>

      <Footer />

      <Dialog open={verifyDialogOpen} onOpenChange={(open) => { if (!open) handleVerifyDialogClose(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <MailCheck className="h-7 w-7 text-primary" />
            </div>
            <DialogTitle className="text-center font-display text-2xl">
              {t("signup.verify.title")}
            </DialogTitle>
            <DialogDescription className="text-center">
              {t("signup.verify.body1")}{" "}
              <span className="font-semibold text-foreground">{signedUpEmail}</span>.{" "}
              {t("signup.verify.body2")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button onClick={handleVerifyDialogClose} className="h-11 rounded-xl px-8">
              {t("signup.verify.cta")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SignUp;
