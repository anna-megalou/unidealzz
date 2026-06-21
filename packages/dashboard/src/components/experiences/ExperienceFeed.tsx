import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { fetchExperienceFeed } from "@/lib/experienceApi";
import { ExperiencePostCard, type ExperiencePost } from "./ExperiencePostCard";

interface Props {
  refreshKey: number;
}

export const ExperienceFeed = ({ refreshKey }: Props) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<ExperiencePost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const mapped = await fetchExperienceFeed(user?.uid);
        if (!cancelled) setPosts(mapped);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey, user?.uid]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 animate-spin" size={18} /> Loading experiences…
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-muted/30 p-10 text-center">
        <p className="font-display text-xl font-bold text-foreground">No stories yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Be the first to share an experience and inspire your campus.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {posts.map((p) => (
        <ExperiencePostCard
          key={p.id}
          post={p}
          onChange={(updated) =>
            setPosts((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
          }
        />
      ))}
    </div>
  );
};
