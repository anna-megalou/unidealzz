import { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  PiggyBank,
  ShoppingBag,
  Heart,
  Bell,
  Bookmark,
  ArrowRight,
  CheckCircle2,
  Circle,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import { Link } from "react-router-dom";
import StudentHubLayout from "@/components/student-hub/StudentHubLayout";
import { Button } from "@/components/ui/button";
import FavoriteButton from "@/components/FavoriteButton";
import { student, recommended as fallbackRecommended } from "@/data/studentHub";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";

const toneClasses = {
  primary: "bg-primary/10 text-primary",
  fashion: "bg-[hsl(var(--category-fashion))]/15 text-[hsl(var(--category-fashion))]",
  success: "bg-emerald-100 text-emerald-700",
};

type ActivityTone = keyof typeof toneClasses;

interface ActivityItem {
  id: string;
  icon: typeof Ticket;
  title: string;
  meta: string;
  tone: ActivityTone;
}

interface RecommendedOffer {
  id: string;
  badge: string;
  badgeTone: "success";
  category: string;
  title: string;
  subtitle: string;
  price: string;
  originalPrice: string;
  image: string;
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80";

const formatRelative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString();
};

const StudentHub = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [displayName, setDisplayName] = useState<string>(student.firstName);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [verification, setVerification] = useState<{
    status: "pending" | "approved" | "rejected" | null;
    verifiedAt: string | null;
  }>({ status: null, verifiedAt: null });

  const [claimedCount, setClaimedCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [lifetimeSavings, setLifetimeSavings] = useState(0);

  const [recommended, setRecommended] = useState<RecommendedOffer[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    if (!user) return;
    setEmailConfirmed(!!user.email_confirmed_at);

    let cancelled = false;

    (async () => {
      // Profile name + avatar
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setAvatarUrl(profile?.avatar_url ?? null);
      const name =
        profile?.display_name ||
        (user.user_metadata?.display_name as string | undefined) ||
        (user.email ? user.email.split("@")[0] : student.firstName);
      setDisplayName(name);

      // Verification status
      const { data: sp } = await supabase
        .from("student_profiles")
        .select("verification_status, verified_at")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled && sp) {
        setVerification({
          status: sp.verification_status,
          verifiedAt: sp.verified_at,
        });
      }

      // Claimed offers + lifetime savings estimate
      const { data: claims } = await supabase
        .from("claimed_offers")
        .select(
          "id, claimed_at, offer:offers(id, title, discount_percent, category_id, brand:brands(name), category:categories(name))",
        )
        .eq("user_id", user.id)
        .order("claimed_at", { ascending: false });

      // Saved (favorites) count and rows
      const { data: favs } = await supabase
        .from("favorites")
        .select(
          "id, created_at, offer:offers(id, title, category_id, category:categories(name))",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (cancelled) return;

      const claimRows = claims ?? [];
      const favRows = favs ?? [];

      setClaimedCount(claimRows.length);
      setSavedCount(favRows.length);

      // Lifetime savings: prefer real logged purchases, else estimate from claims
      const { data: purchases } = await supabase
        .from("purchases")
        .select("amount_saved")
        .eq("user_id", user.id);
      if (cancelled) return;

      if (purchases && purchases.length > 0) {
        const real = purchases.reduce(
          (sum, p: any) => sum + Number(p.amount_saved ?? 0),
          0,
        );
        setLifetimeSavings(real);
      } else {
        const ESTIMATED_AVG_PRICE = 50;
        const savings = claimRows.reduce((sum, c: any) => {
          const pct = c.offer?.discount_percent ?? 15;
          return sum + ESTIMATED_AVG_PRICE * (pct / 100);
        }, 0);
        setLifetimeSavings(savings);
      }

      // Recent activity from claims, favorites and verification
      const acts: ActivityItem[] = [];
      claimRows.slice(0, 3).forEach((c: any) => {
        acts.push({
          id: `c-${c.id}`,
          icon: Ticket,
          title: t("hub.activity.claimed").replace("{title}", c.offer?.title ?? "Offer"),
          meta: `${formatRelative(c.claimed_at)} • ${c.offer?.brand?.name ?? "Brand"}`,
          tone: "primary",
        });
      });
      favRows.slice(0, 3).forEach((f: any) => {
        acts.push({
          id: `f-${f.id}`,
          icon: Heart,
          title: t("hub.activity.saved").replace("{title}", f.offer?.title ?? "Offer"),
          meta: `${formatRelative(f.created_at)} • ${f.offer?.category?.name ?? "Saved"}`,
          tone: "fashion",
        });
      });
      if (sp?.verified_at && sp.verification_status === "approved") {
        acts.push({
          id: "v-approved",
          icon: ShieldCheck,
          title: t("hub.activity.verified"),
          meta: `${formatRelative(sp.verified_at)} • System`,
          tone: "success",
        });
      }
      acts.sort((a, b) => (a.id < b.id ? 1 : -1));
      setActivity(acts.slice(0, 4));

      // Recommended offers — prioritize categories from saved/claimed
      const preferredCategoryIds = Array.from(
        new Set(
          [
            ...favRows.map((f: any) => f.offer?.category_id),
            ...claimRows.map((c: any) => c.offer?.category_id),
          ].filter(Boolean),
        ),
      );

      let offerRows: any[] = [];
      if (preferredCategoryIds.length > 0) {
        const { data } = await supabase
          .from("offers")
          .select(
            "id, title, description, discount_label, discount_percent, image_url, category:categories(name)",
          )
          .eq("active", true)
          .in("category_id", preferredCategoryIds)
          .limit(2);
        offerRows = data ?? [];
      }
      if (offerRows.length < 2) {
        const { data } = await supabase
          .from("offers")
          .select(
            "id, title, description, discount_label, discount_percent, image_url, category:categories(name), featured",
          )
          .eq("active", true)
          .order("featured", { ascending: false })
          .limit(2);
        offerRows = data ?? [];
      }

      if (!cancelled) {
        const mapped: RecommendedOffer[] = offerRows.map((o: any) => ({
          id: o.id,
          badge: o.featured ? "FEATURED" : "TRENDING",
          badgeTone: "success",
          category: (o.category?.name ?? "OFFER").toUpperCase(),
          title: o.title,
          subtitle:
            o.discount_label ??
            (o.discount_percent ? `${o.discount_percent}% off for students` : "Student exclusive"),
          price: o.discount_label ?? (o.discount_percent ? `-${o.discount_percent}%` : "Student"),
          originalPrice: "Limited time",
          image: o.image_url ?? FALLBACK_IMAGE,
        }));
        setRecommended(mapped);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const firstName = displayName.split(" ")[0];

  // Recommendations: real first, fall back to mock to keep grid full
  const recommendedToShow = useMemo(() => {
    if (recommended.length >= 2) return recommended.slice(0, 2);
    return [...recommended, ...fallbackRecommended].slice(0, 2);
  }, [recommended]);

  const verificationLabel =
    verification.status === "approved"
      ? t("hub.verification.approved")
      : verification.status === "pending"
        ? t("hub.verification.pending")
        : verification.status === "rejected"
          ? t("hub.verification.rejected")
          : t("hub.verification.none");

  const idVerified = verification.status === "approved";
  const checklist = [
    { label: t("hub.health.idVerified"), done: idVerified },
    { label: t("hub.health.emailConfirmed"), done: emailConfirmed },
    { label: t("hub.health.profileName"), done: !!displayName && displayName !== student.firstName },
  ];
  const completion = Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100);

  return (
    <StudentHubLayout>
      {/* Top utility row */}
      <div className="mb-6 flex items-center justify-end gap-3">
        <Link
          to="/student-hub/saved"
          className="rounded-full border bg-card p-2 text-muted-foreground hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </Link>
        <Link
          to="/student-hub/saved"
          className="rounded-full border bg-card p-2 text-muted-foreground hover:text-foreground"
          aria-label="Saved deals"
        >
          <Bookmark size={18} />
        </Link>
        <Link to="/student-hub/account" aria-label="Account" className="block">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-9 w-9 rounded-full object-cover ring-1 ring-border"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[hsl(var(--category-fashion))] text-xs font-bold text-primary-foreground">
              {firstName.charAt(0).toUpperCase()}
            </div>
          )}
        </Link>
      </div>

      {/* Welcome + verification */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            <Sparkles size={12} />
            {t("hub.memberStatus")}
          </span>
          <h1 className="mt-4 font-display text-5xl font-bold leading-tight text-foreground">
            {t("hub.welcome")} <span className="text-primary">{firstName}.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground">
            {t("hub.welcomeIntro").replace("{count}", String(student.newOffersToday))}
          </p>
        </div>

      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link
          to="/student-hub/purchases"
          className="block rounded-2xl bg-primary p-6 text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          <div className="flex items-start justify-between">
            <PiggyBank size={28} className="opacity-80" />
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">
              {t("hub.stats.estimated")}
            </span>
          </div>
          <p className="mt-12 font-display text-4xl font-bold">
            €{lifetimeSavings.toLocaleString("el-GR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="mt-1 text-sm opacity-90">{t("hub.stats.lifetime")}</p>
        </Link>

        <Link
          to="/student-hub/claimed"
          className="block rounded-2xl bg-card p-6 ring-1 ring-border transition-all hover:-translate-y-0.5 hover:ring-primary/40 hover:shadow-md"
        >
          <ShoppingBag size={24} className="text-[hsl(var(--category-fashion))]" />
          <p className="mt-12 font-display text-4xl font-bold text-foreground">{claimedCount}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("hub.stats.claimed")}</p>
        </Link>

        <Link
          to="/student-hub/saved"
          className="block rounded-2xl bg-card p-6 ring-1 ring-border transition-all hover:-translate-y-0.5 hover:ring-primary/40 hover:shadow-md"
        >
          <Heart size={24} className="text-emerald-600" />
          <p className="mt-12 font-display text-4xl font-bold text-foreground">{savedCount}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("hub.stats.saved")}</p>
        </Link>
      </div>

      {/* Recommended + Health */}
      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                {t("hub.recommended.title")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("hub.recommended.subtitle").replace("{interests}", student.interests)}
              </p>
            </div>
            <Link to="/offers" className="flex items-center gap-1 text-sm font-semibold text-primary">
              {t("hub.recommended.viewAll")} <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {recommendedToShow.map((r) => (
              <article key={r.id} className="group overflow-hidden rounded-2xl bg-card ring-1 ring-border transition-shadow hover:shadow-lg">
                <Link to={`/offers/${r.id}`} className="block">
                  <div className="relative h-56 w-full overflow-hidden bg-muted">
                    <img src={r.image} alt={r.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                    <span className="absolute left-3 top-3 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                      {r.badge}
                    </span>
                    <FavoriteButton offerId={r.id} className="absolute right-3 top-3" />
                  </div>
                </Link>
                <div className="p-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                    {r.category}
                  </p>
                  <Link to={`/offers/${r.id}`}>
                    <h3 className="mt-2 font-display text-lg font-bold text-foreground hover:text-primary">{r.title}</h3>
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">{r.subtitle}</p>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-lg font-bold text-primary">{r.price}</span>
                    <span className="text-sm text-muted-foreground line-through">{r.originalPrice}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {/* Account Health */}
          <div className="rounded-2xl bg-muted/60 p-6">
            <h3 className="font-display text-lg font-bold text-foreground">{t("hub.health.title")}</h3>
            <div className="mt-5">
              <div className="mb-1 flex items-center justify-between text-xs font-semibold">
                <span className="text-muted-foreground">{t("hub.health.completion")}</span>
                <span className="text-primary">{completion}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>
            <ul className="mt-5 space-y-3 text-sm">
              {checklist.map((c) => (
                <li key={c.label} className="flex items-center gap-2">
                  {c.done ? (
                    <CheckCircle2 size={18} className="text-emerald-600" />
                  ) : (
                    <Circle size={18} className="text-muted-foreground" />
                  )}
                  <span className={c.done ? "text-foreground" : "text-muted-foreground"}>{c.label}</span>
                </li>
              ))}
            </ul>
            <Button asChild variant="secondary" className="mt-5 w-full rounded-full font-semibold text-primary">
              <Link to="/student-hub/account">{t("hub.health.cta")}</Link>
            </Button>
          </div>

          {/* Recent Activity */}
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">{t("hub.activity.title")}</h3>
            {activity.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                {t("hub.activity.empty")}
              </p>
            ) : (
              <ul className="mt-4 space-y-4">
                {activity.map((a) => (
                  <li key={a.id} className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${toneClasses[a.tone]}`}>
                      <a.icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.meta}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

    </StudentHubLayout>
  );
};

export default StudentHub;
