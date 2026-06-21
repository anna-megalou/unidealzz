import { useState } from "react";
import { Heart, MapPin, MessageCircle, Star, ThumbsUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ExperienceComments } from "./ExperienceComments";

export interface ExperiencePost {
  id: string;
  userId: string;
  authorName: string;
  authorAvatar: string | null;
  title: string;
  content: string;
  rating: number | null;
  wouldRecommend: boolean | null;
  savingsAmount: number | null;
  locationText: string | null;
  createdAt: string;
  brand: { id: string; name: string; logoUrl: string | null } | null;
  category: { id: string; name: string } | null;
  images: string[];
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
}

const formatRelative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
};

const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

interface Props {
  post: ExperiencePost;
  onChange: (post: ExperiencePost) => void;
}

export const ExperiencePostCard = ({ post, onChange }: Props) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [busy, setBusy] = useState(false);

  const toggleLike = async () => {
    if (!user) {
      toast.error("Sign in to like posts");
      return;
    }
    if (busy) return;
    setBusy(true);
    const wasLiked = post.likedByMe;
    onChange({
      ...post,
      likedByMe: !wasLiked,
      likeCount: post.likeCount + (wasLiked ? -1 : 1),
    });
    try {
      if (wasLiked) {
        await supabase
          .from("experience_post_likes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("experience_post_likes")
          .insert({ post_id: post.id, user_id: user.id });
      }
    } catch (e: any) {
      // revert
      onChange(post);
      toast.error("Couldn't update like");
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
      {post.images.length > 0 && (
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          <img
            src={post.images[0]}
            alt={post.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          {post.images.length > 1 && (
            <span className="absolute right-3 top-3 rounded-full bg-foreground/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-background">
              +{post.images.length - 1}
            </span>
          )}
          {post.wouldRecommend && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
              <ThumbsUp size={10} /> Recommends
            </span>
          )}
        </div>
      )}

      <div className="p-5">
        <div className="flex items-center gap-3">
          {post.authorAvatar ? (
            <img
              src={post.authorAvatar}
              alt={post.authorName}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[hsl(var(--category-fashion))] text-xs font-bold text-primary-foreground">
              {initialsOf(post.authorName)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{post.authorName}</p>
            <p className="text-xs text-muted-foreground">{formatRelative(post.createdAt)}</p>
          </div>
          {post.rating ? (
            <div className="flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              {post.rating}
            </div>
          ) : null}
        </div>

        <h3 className="mt-3 font-display text-lg font-bold text-foreground">{post.title}</h3>
        <p className="mt-1.5 text-sm text-muted-foreground line-clamp-3">{post.content}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {post.brand && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
              {post.brand.logoUrl && (
                <img src={post.brand.logoUrl} alt="" className="h-3.5 w-3.5 rounded-sm object-contain" />
              )}
              {post.brand.name}
            </span>
          )}
          {post.category && (
            <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
              {post.category.name}
            </span>
          )}
          {post.savingsAmount ? (
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              Saved €{post.savingsAmount.toFixed(2)}
            </span>
          ) : null}
          {post.locationText && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
              <MapPin size={10} /> {post.locationText}
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center gap-4 border-t pt-3">
          <button
            onClick={toggleLike}
            className={cn(
              "inline-flex items-center gap-1.5 text-sm font-semibold transition-colors",
              post.likedByMe ? "text-rose-600" : "text-muted-foreground hover:text-foreground",
            )}
            aria-pressed={post.likedByMe}
          >
            <Heart size={16} className={cn(post.likedByMe && "fill-rose-600")} />
            {post.likeCount}
          </button>
          <button
            onClick={() => setShowComments((v) => !v)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <MessageCircle size={16} />
            {post.commentCount}
          </button>
        </div>

        {showComments && (
          <ExperienceComments
            postId={post.id}
            onCountChange={(count) => onChange({ ...post, commentCount: count })}
          />
        )}
      </div>
    </article>
  );
};
