import { useState } from "react";
import { Check, Crown, ShieldCheck, Lock, CreditCard } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/home/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { premiumHero } from '@/lib/assets';
import { useLanguage } from '@/hooks/useLanguage';
import type { TranslationKey } from '@unidealz/shared';

const Premium = () => {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const perks: { titleKey: TranslationKey; bodyKey: TranslationKey }[] = [
    { titleKey: "premium.perk1.title", bodyKey: "premium.perk1.body" },
    { titleKey: "premium.perk2.title", bodyKey: "premium.perk2.body" },
    { titleKey: "premium.perk3.title", bodyKey: "premium.perk3.body" },
    { titleKey: "premium.perk4.title", bodyKey: "premium.perk4.body" },
  ];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(t("premium.checkout.success"), {
      description: t("premium.checkout.successDesc"),
    });
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(0deg, #FCF8FE, #FCF8FE), hsl(var(--background))" }}
    >
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h1 className="font-display text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl">
              {t("premium.title")}
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              {t("premium.subtitle")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Badge className="rounded-full bg-[hsl(151_72%_55%)] px-4 py-1.5 font-semibold text-white hover:bg-[hsl(151_72%_50%)]">
                {t("premium.badge.limited")}
              </Badge>
              <Badge variant="outline" className="rounded-full px-4 py-1.5">
                <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                {t("premium.badge.verified")}
              </Badge>
            </div>
          </div>

          <div className="relative">
            <img
              src={premiumHero}
              alt={t("premium.hero.alt")}
              className="aspect-square w-full rounded-3xl object-cover shadow-2xl shadow-primary/10"
              loading="lazy"
            />
          </div>
        </section>

        {/* Subscription Grid */}
        <section className="mt-20 grid gap-6 lg:grid-cols-2">
          {/* Premium Plan */}
          <div className="relative rounded-3xl bg-card p-8 ring-1 ring-border">
            <div className="flex items-start justify-between">
              <h2 className="font-display text-2xl font-bold text-foreground">{t("premium.plan.title")}</h2>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Crown className="h-6 w-6 text-primary" />
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-display text-5xl font-extrabold text-primary">€3</span>
              <span className="text-muted-foreground">{t("premium.plan.priceUnit")}</span>
            </div>

            <ul className="mt-8 space-y-5">
              {perks.map((p) => (
                <li key={p.titleKey} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[hsl(151_72%_55%)]">
                    <Check className="h-4 w-4 text-white" strokeWidth={3} />
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">{t(p.titleKey)}</p>
                    <p className="text-sm text-muted-foreground">{t(p.bodyKey)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Checkout */}
          <div className="rounded-3xl bg-card p-8 ring-1 ring-border">
            <h2 className="font-display text-2xl font-bold text-foreground">{t("premium.checkout.title")}</h2>

            <form onSubmit={handleSubscribe} className="mt-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">{t("premium.checkout.cardholder")}</Label>
                <Input
                  id="name"
                  placeholder={t("premium.checkout.cardholderPlaceholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="card">{t("premium.checkout.cardNumber")}</Label>
                <div className="relative">
                  <Input
                    id="card"
                    inputMode="numeric"
                    placeholder="0000 0000 0000 0000"
                    value={card}
                    onChange={(e) => setCard(e.target.value)}
                    required
                  />
                  <CreditCard className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">{t("premium.checkout.expiry")}</Label>
                  <Input
                    id="expiry"
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">{t("premium.checkout.cvv")}</Label>
                  <Input
                    id="cvv"
                    inputMode="numeric"
                    placeholder="123"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full rounded-xl font-semibold">
                {t("premium.checkout.submit")}
              </Button>

              <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                {t("premium.checkout.secure")}
              </p>
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Premium;
