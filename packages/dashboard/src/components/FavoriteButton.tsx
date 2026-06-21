import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { addFavorite, isFavorite, removeFavorite } from "@/lib/firestoreData";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  offerId: string;
  className?: string;
}

const FavoriteButton = ({ offerId, className }: FavoriteButtonProps) => {
  const { user } = useAuth();
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsFav(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const fav = await isFavorite(user.uid, offerId);
      if (!cancelled) setIsFav(fav);
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

    try {
      if (isFav) {
        await removeFavorite(user.uid, offerId);
        setIsFav(false);
      } else {
        await addFavorite(user.uid, offerId);
        setIsFav(true);
        toast.success("Added to favorites");
      }
    } catch {
      toast.error(isFav ? "Couldn't remove favorite" : "Couldn't save favorite");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={isFav}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full border bg-background/80 backdrop-blur transition-colors",
        isFav ? "border-primary text-primary" : "border-border text-muted-foreground hover:text-primary",
        className,
      )}
    >
      <Heart className={cn("h-4 w-4", isFav && "fill-current")} />
    </button>
  );
};

export default FavoriteButton;
