import { toast } from 'sonner';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { dashboardSignupUrl } from '@/lib/dashboardUrl';

interface FavoriteButtonProps {
  offerId: string;
  className?: string;
}

const FavoriteButton = ({ offerId, className }: FavoriteButtonProps) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    void offerId;
    toast.error('Please sign up to save your favorite offers!', {
      action: {
        label: 'Sign up',
        onClick: () => {
          window.location.href = dashboardSignupUrl;
        },
      },
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Add to favorites"
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm shadow-sm transition-transform hover:scale-110 active:scale-95',
        className,
      )}
    >
      <Heart size={18} className="fill-transparent text-foreground transition-colors" />
    </button>
  );
};

export default FavoriteButton;
