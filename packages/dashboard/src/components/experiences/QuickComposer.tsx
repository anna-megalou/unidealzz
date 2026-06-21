import { Image as ImageIcon, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  onOpen: () => void;
}

const initialsOf = (name: string) =>
  name
    .split(/[\s@.]+/)
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

export const QuickComposer = ({ onOpen }: Props) => {
  const { user } = useAuth();
  const name = user?.displayName || user?.email?.split("@")[0] || "Student";

  return (
    <div className="rounded-2xl bg-card p-4 ring-1 ring-border shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[hsl(var(--category-fashion))] text-xs font-bold text-primary-foreground">
          {initialsOf(name)}
        </div>
        <button
          onClick={onOpen}
          className="flex-1 rounded-full bg-muted px-4 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/70"
        >
          Share your latest find…
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onOpen}
            className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted/70"
          >
            <ImageIcon size={14} /> Add Photo
          </button>
          <button
            onClick={onOpen}
            className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted/70"
          >
            <Tag size={14} /> Brand
          </button>
        </div>
        <Button onClick={onOpen} className="rounded-full font-semibold" size="sm">
          Post Now
        </Button>
      </div>
    </div>
  );
};
