import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  offerId: string;
  className?: string;
}

const FavoriteButton = ({ offerId, className }: FavoriteButtonProps) => {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsFavorite(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("offer_id", offerId)
        .maybeSingle();
      if (!cancelled) setIsFavorite(!!data);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, offerId]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Please sign up to save your favorite offers!");
      return;
    }
    if (loading) return;
    setLoading(true);

    if (isFavorite) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("offer_id", offerId);
      if (error) {
        toast.error("Couldn't remove favorite");
      } else {
        setIsFavorite(false);
      }
    } else {
      const { error } = await supabase
        .from("favorites")
        .insert({ user_id: user.id, offer_id: offerId });
      if (error) {
        toast.error("Couldn't save favorite");
      } else {
        setIsFavorite(true);
        toast.success("Added to favorites");
      }
    }
    setLoading(false);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={isFavorite}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm shadow-sm transition-transform hover:scale-110 active:scale-95",
        className,
      )}
    >
      <Heart
        size={18}
        className={cn(
          "transition-colors",
          isFavorite ? "fill-primary text-primary" : "fill-transparent text-foreground",
        )}
      />
    </button>
  );
};

export default FavoriteButton;
