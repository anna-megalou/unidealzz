import { useCallback, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import StudentHubLayout from "@/components/student-hub/StudentHubLayout";
import { ExperienceComposer } from "@/components/experiences/ExperienceComposer";
import { ExperienceFeed } from "@/components/experiences/ExperienceFeed";
import { QuickComposer } from "@/components/experiences/QuickComposer";
import { TrendingBrandsWidget } from "@/components/experiences/TrendingBrandsWidget";
import { MostLikedWidget } from "@/components/experiences/MostLikedWidget";
import { CommunityFavoritesCard } from "@/components/experiences/CommunityFavoritesCard";

const Experiences = () => {
  const [composerOpen, setComposerOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePosted = useCallback(() => {
    setComposerOpen(false);
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    document.title = "Student Experiences · Unidealz";
  }, []);

  return (
    <StudentHubLayout>
      {/* Hero card */}
      <div className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-card to-[hsl(var(--category-fashion)/0.12)] p-8 ring-1 ring-border">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            <Sparkles size={12} />
            Community
          </span>
          <h1 className="mt-3 font-display text-4xl font-bold leading-tight text-foreground">
            Student Experiences
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            See what students are loving, sharing, and recommending from real
            Unidealz deals. Join the community and inspire others with your finds.
          </p>
        </div>
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main feed column */}
        <div className="space-y-5">
          <QuickComposer onOpen={() => setComposerOpen(true)} />
          <ExperienceFeed refreshKey={refreshKey} />
        </div>

        {/* Sidebar widgets */}
        <aside className="space-y-5">
          <TrendingBrandsWidget />
          <MostLikedWidget />
          <CommunityFavoritesCard />
        </aside>
      </div>

      <ExperienceComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        onPosted={handlePosted}
      />
    </StudentHubLayout>
  );
};

export default Experiences;
