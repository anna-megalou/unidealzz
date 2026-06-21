import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
      const { data: rows } = await supabase
        .from("experience_posts")
        .select(
          `id, user_id, title, content, rating, would_recommend, savings_amount,
           location_text, created_at,
           brand:brands(id, name, logo_url),
           category:categories(id, name),
           images:experience_post_images(id, image_url, position),
           likes:experience_post_likes(user_id),
           comments:experience_post_comments(id)`,
        )
        .eq("visible", true)
        .order("created_at", { ascending: false })
        .limit(50);

      if (cancelled) return;

      const userIds = Array.from(new Set((rows ?? []).map((r: any) => r.user_id)));
      const { data: profiles } = userIds.length
        ? await supabase
            .from("profiles")
            .select("user_id, display_name, avatar_url")
            .in("user_id", userIds)
        : { data: [] as any[] };

      const profileMap = new Map<string, { display_name: string | null; avatar_url: string | null }>();
      (profiles ?? []).forEach((p: any) =>
        profileMap.set(p.user_id, { display_name: p.display_name, avatar_url: p.avatar_url }),
      );

      const mapped: ExperiencePost[] = (rows ?? []).map((r: any) => {
        const images = (r.images ?? [])
          .slice()
          .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
          .map((img: any) => img.image_url);
        const likeUserIds: string[] = (r.likes ?? []).map((l: any) => l.user_id);
        return {
          id: r.id,
          userId: r.user_id,
          authorName: profileMap.get(r.user_id)?.display_name ?? "Student",
          authorAvatar: profileMap.get(r.user_id)?.avatar_url ?? null,
          title: r.title,
          content: r.content,
          rating: r.rating,
          wouldRecommend: r.would_recommend,
          savingsAmount: r.savings_amount ? Number(r.savings_amount) : null,
          locationText: r.location_text,
          createdAt: r.created_at,
          brand: r.brand ? { id: r.brand.id, name: r.brand.name, logoUrl: r.brand.logo_url } : null,
          category: r.category ? { id: r.category.id, name: r.category.name } : null,
          images,
          likeCount: likeUserIds.length,
          likedByMe: user ? likeUserIds.includes(user.id) : false,
          commentCount: (r.comments ?? []).length,
        };
      });

      setPosts(mapped);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey, user]);

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
