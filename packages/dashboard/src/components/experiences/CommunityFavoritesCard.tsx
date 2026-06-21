import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { doc, getDoc } from "firebase/firestore";
import { fetchExperienceFeed } from "@/lib/experienceApi";
import { db } from "@/lib/firebase";
import { Collections } from "@/lib/collections";

interface Contributor {
  userId: string;
  avatarUrl: string | null;
  displayName: string | null;
}

const initialsOf = (name: string | null) =>
  (name ?? "S")
    .split(/[\s@.]+/)
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

export const CommunityFavoritesCard = () => {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const posts = await fetchExperienceFeed();
      if (cancelled) return;

      const seen = new Set<string>();
      const ordered: string[] = [];
      posts.forEach((p) => {
        if (!seen.has(p.userId)) {
          seen.add(p.userId);
          ordered.push(p.userId);
        }
      });
      const topIds = ordered.slice(0, 4);
      setTotalCount(posts.length);

      if (topIds.length === 0) return;

      const profiles = await Promise.all(
        topIds.map(async (uid) => {
          const snap = await getDoc(doc(db, Collections.USERS, uid));
          const data = snap.data() ?? {};
          return {
            userId: uid,
            avatarUrl: (data.avatarUrl as string | null) ?? null,
            displayName: (data.displayName as string | null) ?? null,
          };
        }),
      );

      if (!cancelled) setContributors(profiles);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleExplore = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary to-[hsl(var(--category-fashion))] p-5 text-primary-foreground shadow-lg">
      <h3 className="font-display text-base font-bold">Community Favorites</h3>
      <p className="mt-1.5 text-xs opacity-90">
        Our curated list of the best-reviewed experiences this month.
      </p>

      <div className="mt-4 flex items-center">
        <div className="flex -space-x-2">
          {contributors.length === 0 &&
            [0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-9 w-9 rounded-full border-2 border-primary bg-primary-foreground/20"
              />
            ))}
          {contributors.map((c) => (
            <div
              key={c.userId}
              className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-primary bg-primary-foreground/20 text-[10px] font-bold text-primary-foreground"
              title={c.displayName ?? "Student"}
            >
              {c.avatarUrl ? (
                <img
                  src={c.avatarUrl}
                  alt={c.displayName ?? "Student"}
                  className="h-full w-full object-cover"
                />
              ) : (
                initialsOf(c.displayName)
              )}
            </div>
          ))}
        </div>
        {totalCount > contributors.length && (
          <span className="ml-2 inline-flex h-9 items-center rounded-full bg-primary-foreground/20 px-2.5 text-[11px] font-bold text-primary-foreground">
            +{Math.max(totalCount - contributors.length, 1)}
          </span>
        )}
      </div>

      <Button
        onClick={handleExplore}
        variant="secondary"
        size="sm"
        className="mt-4 w-full rounded-full font-semibold"
      >
        Explore Gallery
      </Button>
    </div>
  );
};
