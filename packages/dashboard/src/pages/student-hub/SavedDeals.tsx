import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StudentHubLayout from "@/components/student-hub/StudentHubLayout";
import { Button } from "@/components/ui/button";
import { savedRecommendations } from "@/data/studentHub";
import { useAuth } from "@/hooks/useAuth";
import { fetchSavedDeals, removeSavedDeal } from "@/lib/studentHubApi";
import { toast } from "sonner";
import { Backpack, Plane, Film, X } from "lucide-react";

const iconMap = {
  backpack: Backpack,
  plane: Plane,
  film: Film,
};

const SavedDeals = () => {
  const { user } = useAuth();
  const [saved, setSaved] = useState<Awaited<ReturnType<typeof fetchSavedDeals>>>([]);
  const [loading, setLoading] = useState(true);

  const fetchSaved = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const rows = await fetchSavedDeals(user.uid);
      setSaved(rows);
    } catch {
      toast.error("Couldn't load your saved offers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleRemove = async (favoriteId: string) => {
    if (!user) return;
    const previous = saved;
    setSaved((s) => s.filter((r) => r.favoriteId !== favoriteId));
    try {
      await removeSavedDeal(user.uid, favoriteId);
      toast.success("Removed from saved");
    } catch {
      setSaved(previous);
      toast.error("Couldn't remove this offer");
    }
  };

  return (
    <StudentHubLayout>
      <div className="-mx-8 -my-8 min-h-[calc(100vh-4rem)] bg-gradient-to-b from-[hsl(280_60%_98%)] to-[hsl(280_60%_98%)] px-8 py-10">
        <header className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <h1 className="font-display text-5xl font-bold leading-tight text-foreground">
              Your Curated <span className="italic text-primary">Favorites</span>
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              A private collection of the finest student opportunities you've
              discovered. Keep them safe until you're ready to redeem.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 self-start rounded-full bg-card px-4 py-2 text-xs font-semibold text-muted-foreground ring-1 ring-border md:self-auto">
            <span>{saved.length} Items Saved</span>
            <span className="text-muted-foreground/50">•</span>
            <Link to="/offers" className="text-primary hover:underline">Browse offers</Link>
          </div>
        </header>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading your saved offers…</p>
        ) : saved.length === 0 ? (
          <section className="rounded-3xl bg-card p-10 text-center ring-1 ring-border">
            <h2 className="font-display text-2xl font-bold text-foreground">No saved offers yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Tap the heart on any offer to save it here for later.
            </p>
            <Button asChild className="mt-6 rounded-full font-semibold">
              <Link to="/offers">Explore offers</Link>
            </Button>
          </section>
        ) : (
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {saved.map((d) => (
              <article
                key={d.favoriteId}
                className="overflow-hidden rounded-3xl bg-card shadow-[0_25px_50px_-12px_rgba(0,0,0,0.08)] ring-4 ring-background"
              >
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    src={d.image}
                    alt={d.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-emerald-300 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-900">
                    {d.badge}
                  </span>
                  <button
                    onClick={() => handleRemove(d.favoriteId)}
                    aria-label="Remove"
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-foreground/30 text-white backdrop-blur-sm hover:bg-foreground/50"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="p-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                    {d.category}
                  </p>
                  <h3 className="mt-2 font-display text-xl font-bold text-foreground">
                    {d.title}
                  </h3>
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-3">
                    {d.description ?? "Premium offer curated for verified students."}
                  </p>
                  <Button asChild className="mt-5 w-full rounded-xl font-semibold">
                    <Link to={`/offers/${d.offerId}`}>View Offer</Link>
                  </Button>
                </div>
              </article>
            ))}
          </section>
        )}

        <section className="mt-16">
          <h2 className="mb-6 font-display text-3xl font-bold text-foreground">
            Recommended for <span className="italic text-emerald-600">You</span>
          </h2>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <article className="relative h-80 overflow-hidden rounded-3xl bg-muted">
              <img
                src={savedRecommendations.feature.image}
                alt={savedRecommendations.feature.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/90">
                  {savedRecommendations.feature.eyebrow}
                </p>
                <h3 className="mt-2 max-w-xs font-display text-2xl font-bold text-white">
                  {savedRecommendations.feature.title}
                </h3>
                <Link
                  to="/offers"
                  className="mt-4 inline-block rounded-full bg-foreground px-5 py-2 text-xs font-semibold text-background hover:bg-foreground/90"
                >
                  {savedRecommendations.feature.cta}
                </Link>
              </div>
            </article>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {savedRecommendations.tiles.map((t, idx) => {
                const Icon = iconMap[t.icon];
                const isWide = idx === 0;
                return (
                  <article
                    key={t.id}
                    className={`relative overflow-hidden rounded-3xl p-6 ${t.bg} ${t.fg} ${
                      isWide ? "sm:col-span-2 h-36" : "h-36"
                    }`}
                  >
                    <Icon className="absolute right-5 top-5 opacity-80" size={28} />
                    <div className="absolute bottom-5 left-6 right-6">
                      <h3 className="font-display text-lg font-bold leading-tight">
                        {t.title}
                      </h3>
                      {t.subtitle && (
                        <p className="mt-1 text-xs opacity-90">{t.subtitle}</p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </StudentHubLayout>
  );
};

export default SavedDeals;
