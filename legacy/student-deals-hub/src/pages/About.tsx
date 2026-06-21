import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/home/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, ShoppingBag, Sparkles, ShieldCheck, BadgeCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import type { TranslationKey } from "@/i18n/translations";
import libraryImg from "@/assets/about-hero.png";
import laptopImg from "@/assets/about-laptop.jpg";
import studentsImg from "@/assets/about-students.jpg";

const About = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [brand, setBrand] = useState("");
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data: verifiedCount, isLoading: verifiedLoading } = useQuery({
    queryKey: ["registered-students-count"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_registered_students_count" as any);
      if (error) throw error;
      return (data as number) ?? 0;
    },
  });

  const formatVerified = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k+` : `${n}`;

  const partnerFeatures: { titleKey: TranslationKey; bodyKey: TranslationKey }[] = [
    { titleKey: "about.partners.f1.title", bodyKey: "about.partners.f1.body" },
    { titleKey: "about.partners.f2.title", bodyKey: "about.partners.f2.body" },
    { titleKey: "about.partners.f3.title", bodyKey: "about.partners.f3.body" },
    { titleKey: "about.partners.f4.title", bodyKey: "about.partners.f4.body" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !brand) {
      toast.error(t("about.partners.form.fillAll"));
      return;
    }
    setSubmitting(true);
    const { error } = await supabase
      .from("partnership_requests")
      .insert({ email: email.trim(), brand_name: brand.trim() });
    setSubmitting(false);

    if (error) {
      toast.error(t("about.partners.form.error"), { description: error.message });
      return;
    }

    toast.success(t("about.partners.form.success"), {
      description: t("about.partners.form.successDesc"),
    });
    setEmail("");
    setBrand("");
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(0deg, #FCF8FE, #FCF8FE), hsl(var(--background))" }}
    >
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="container pt-20 pb-16">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em]" style={{ color: "#842CD3" }}>
            {t("about.eyebrow")}
          </span>
          <div className="mt-4 grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-end">
            <h1 className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-foreground md:text-6xl lg:text-7xl">
              {t("about.titleA")}<span className="text-foreground">{t("about.titleB")}</span>
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed lg:max-w-sm">
              {t("about.subtitle")}
            </p>
          </div>

          <div className="relative mt-10 overflow-hidden rounded-3xl">
            <img
              src={libraryImg}
              alt={t("about.hero.alt")}
              className="h-[280px] w-full object-cover sm:h-[420px] lg:h-[560px]"
              loading="lazy"
            />
            <div
              className="absolute bottom-6 right-6 rounded-2xl px-5 py-3 shadow-lg"
              style={{ backgroundColor: "#6FFBBE" }}
            >
              <p className="font-display text-sm font-semibold text-emerald-950 leading-tight whitespace-pre-line">
                {t("about.hero.badge")}
              </p>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="bg-muted/40 py-20">
          <div className="container grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
                {t("about.mission.title")}
              </h2>
              <p className="mt-5 max-w-md text-base text-muted-foreground leading-relaxed">
                {t("about.mission.body")}
              </p>
              <ul className="mt-8 space-y-5">
                <li className="flex gap-4">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Sparkles className="h-4 w-4 text-primary" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="font-display text-sm font-bold text-foreground">{t("about.mission.quality.title")}</p>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {t("about.mission.quality.body")}
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <BadgeCheck className="h-4 w-4 text-primary" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="font-display text-sm font-bold text-foreground">{t("about.mission.trust.title")}</p>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {t("about.mission.trust.body")}
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Image collage */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="overflow-hidden rounded-2xl">
                  <img src={laptopImg} alt={t("about.collage.laptop.alt")} className="h-48 w-full object-cover sm:h-56" loading="lazy" />
                </div>
                <div className="rounded-2xl bg-primary p-6 text-primary-foreground">
                  <p className="font-display text-3xl font-extrabold">
                    {verifiedLoading ? "..." : formatVerified(verifiedCount ?? 0)}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.15em] opacity-80">
                    {t("about.stat.verified")}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-[32px] p-6 text-foreground" style={{ backgroundColor: "#AF5CFE" }}>
                  <p className="font-display text-3xl font-extrabold">100+</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-foreground/80">
                    {t("about.stat.brands")}
                  </p>
                </div>
                <div className="overflow-hidden rounded-2xl">
                  <img src={studentsImg} alt={t("about.collage.students.alt")} className="h-56 w-full object-cover sm:h-64" loading="lazy" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* For Students */}
        <section className="container py-20">
          <h2 className="text-center font-display text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            {t("about.students.title")}
          </h2>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {/* Elite access — large */}
            <div className="rounded-2xl border border-border/50 bg-card p-7 shadow-sm lg:col-span-2">
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.15em] text-emerald-950"
                style={{ backgroundColor: "#6FFBBE" }}
              >
                {t("about.students.perks")}
              </span>
              <h3 className="mt-5 font-display text-xl font-bold text-foreground">
                {t("about.students.access.title")}
              </h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
                {t("about.students.access.body")}
              </p>
              <div className="mt-6 overflow-hidden rounded-xl">
                <img src={laptopImg} alt={t("about.students.access.alt")} className="h-44 w-full object-cover" loading="lazy" />
              </div>
            </div>

            {/* Trending */}
            <div className="flex flex-col rounded-2xl bg-primary p-7 text-primary-foreground">
              <svg
                width="24"
                height="32"
                viewBox="0 0 24 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-primary-foreground"
                aria-hidden
              >
                <path
                  d="M8.5125 17.55L9.825 13.275L6.375 10.5H10.65L12 6.3L13.35 10.5H17.625L14.1375 13.275L15.45 17.55L12 14.8875L8.5125 17.55V17.55M3 31.5V19.9125C2.05 18.8625 1.3125 17.6625 0.7875 16.3125C0.2625 14.9625 0 13.525 0 12C0 8.65 1.1625 5.8125 3.4875 3.4875C5.8125 1.1625 8.65 0 12 0C15.35 0 18.1875 1.1625 20.5125 3.4875C22.8375 5.8125 24 8.65 24 12C24 13.525 23.7375 14.9625 23.2125 16.3125C22.6875 17.6625 21.95 18.8625 21 19.9125V31.5L12 28.5L3 31.5V31.5M12 21C14.5 21 16.625 20.125 18.375 18.375C20.125 16.625 21 14.5 21 12C21 9.5 20.125 7.375 18.375 5.625C16.625 3.875 14.5 3 12 3C9.5 3 7.375 3.875 5.625 5.625C3.875 7.375 3 9.5 3 12C3 14.5 3.875 16.625 5.625 18.375C7.375 20.125 9.5 21 12 21V21M6 27.0375L12 25.5L18 27.0375V22.3875C17.125 22.8875 16.1812 23.2813 15.1687 23.5688C14.1562 23.8563 13.1 24 12 24C10.9 24 9.84375 23.8563 8.83125 23.5688C7.81875 23.2813 6.875 22.8875 6 22.3875V27.0375V27.0375M12 24.7125V24.7125V24.7125V24.7125V24.7125V24.7125V24.7125V24.7125V24.7125V24.7125"
                  fill="currentColor"
                />
              </svg>
              <h3 className="mt-5 font-display text-xl font-bold">{t("about.students.trending.title")}</h3>
              <p className="mt-2 text-sm leading-relaxed text-primary-foreground/75">
                {t("about.students.trending.body")}
              </p>
              <Button
                onClick={() => navigate("/student-hub")}
                className="mt-auto h-14 w-full rounded-full bg-background text-base font-semibold text-primary shadow-sm hover:bg-background/90"
              >
                {t("about.students.trending.cta")}
              </Button>
            </div>

            {/* Save for Later */}
            <button
              type="button"
              onClick={() => setSaved((v) => !v)}
              className="group flex flex-col items-start justify-center rounded-[32px] px-10 py-[72px] text-left transition-all hover:shadow-md"
              style={{ backgroundColor: "#F0ECF6" }}
              aria-pressed={saved}
            >
              <Heart
                className="h-7 w-7 text-primary transition-transform group-hover:scale-110"
                strokeWidth={2}
                fill={saved ? "currentColor" : "none"}
              />
              <h3 className="mt-5 font-display text-lg font-bold text-foreground">{t("about.students.save.title")}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {t("about.students.save.body")}
              </p>
            </button>

            {/* Exclusive Drops */}
            <div className="relative flex items-start justify-between gap-5 overflow-hidden rounded-2xl bg-foreground p-7 text-background lg:col-span-2">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-4 -top-4 h-32 w-32 rounded-full"
                style={{ background: "rgba(99, 102, 241, 0.2)", filter: "blur(32px)" }}
              />
              <div className="relative">
                <h3 className="font-display text-xl font-bold">{t("about.students.drops.title")}</h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-background/70">
                  {t("about.students.drops.body")}
                </p>
              </div>
              <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-primary/15">
                <ShoppingBag className="h-10 w-10 text-primary" strokeWidth={2} />
              </div>
            </div>
          </div>
        </section>

        {/* For Partners */}
        <section className="bg-foreground py-20 text-background">
          <div className="container grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:items-start">
            <div>
              <h2 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">
                {t("about.partners.title")}
              </h2>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-background/70">
                {t("about.partners.body")}
              </p>

              <div className="mt-10 grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2">
                {partnerFeatures.map((f) => (
                  <div key={f.titleKey}>
                    <p className="font-display text-sm font-bold">{t(f.titleKey)}</p>
                    <p className="mt-2 text-xs leading-relaxed text-background/65">{t(f.bodyKey)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Partner form */}
            <div className="rounded-2xl border border-background/10 bg-background/[0.04] p-7 backdrop-blur">
              <h3 className="font-display text-xl font-bold">{t("about.partners.form.title")}</h3>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="work-email" className="text-[10px] font-bold uppercase tracking-[0.15em] text-background/60">
                    {t("about.partners.form.email")}
                  </Label>
                  <Input
                    id="work-email"
                    type="email"
                    placeholder={t("about.partners.form.emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 rounded-xl border-background/15 bg-background/5 text-sm text-background placeholder:text-background/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand-name" className="text-[10px] font-bold uppercase tracking-[0.15em] text-background/60">
                    {t("about.partners.form.brand")}
                  </Label>
                  <Input
                    id="brand-name"
                    type="text"
                    placeholder={t("about.partners.form.brandPlaceholder")}
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="h-11 rounded-xl border-background/15 bg-background/5 text-sm text-background placeholder:text-background/40"
                  />
                </div>
                <Button type="submit" disabled={submitting} className="h-12 w-full rounded-full font-display text-sm font-semibold">
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("about.partners.form.submitting")}
                    </>
                  ) : (
                    t("about.partners.form.submit")
                  )}
                </Button>
                <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-background/50">
                  <ShieldCheck className="h-3 w-3" />
                  {t("about.partners.form.note")}
                </p>
              </form>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
