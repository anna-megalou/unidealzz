import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Crown, Bell, Star, Zap, Sparkles, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useABTest } from '@/hooks/useABTest';

const EXPERIMENT_KEY = 'premium_cta_v1';

const perks = [
  { icon: Bell, text: "Notified first about new drops" },
  { icon: Star, text: "Exclusive premium-only discounts" },
  { icon: Zap, text: "Early access to flash sales" },
  { icon: Sparkles, text: "Priority support & perks" },
];

const GetPremiumPopup = () => {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [cookieBannerOpen, setCookieBannerOpen] = useState(false);
  const { variant, track } = useABTest(EXPERIMENT_KEY);

  useEffect(() => {
    const check = () => {
      const banner = document.querySelector('[aria-label="Cookie consent"]');
      setCookieBannerOpen(!!banner);
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  // Log a single "view" per session per variant
  useEffect(() => {
    if (!variant) return;
    const key = `ab_view_${EXPERIMENT_KEY}_${variant}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    track("view", { surface: "popup" });
  }, [variant, track]);

  const handleOpen = (next: boolean) => {
    setOpen(next);
    if (next) track("click", { surface: "popup_open" });
  };

  const isB = variant === "B";

  // Show to all visitors (anonymous + logged-in) so A/B test can be previewed without login.
  // Variant B users see the "Unlock More Offers With Premium" CTA on the Offers page instead.
  if (variant === "B") return null;


  return (
    <Dialog open={open} onOpenChange={handleOpen}>

      <div
        className={cn(
          "fixed right-4 z-50 transition-[bottom] duration-300 sm:right-6",
          cookieBannerOpen ? "bottom-44 sm:bottom-48" : "bottom-4 sm:bottom-6",
        )}
      >
        {collapsed ? (
          <button
            onClick={() => setCollapsed(false)}
            aria-label="Expand Get Premium"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 ring-1 ring-primary/20 transition-transform hover:scale-105"
          >
            <Crown className="h-5 w-5" />
          </button>
        ) : isB ? (
          // Variant B: gold pill with "Save 50%" hook + animated glow
          <div className="relative flex items-center gap-1 rounded-full pr-1 shadow-xl ring-1 ring-amber-300/40"
               style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}>
            <span className="absolute -inset-1 rounded-full bg-amber-400/40 blur-md animate-pulse" aria-hidden />
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="group relative rounded-full bg-transparent px-5 font-display font-bold text-white shadow-none ring-0 hover:bg-white/10"
              >
                <Sparkles className="h-4 w-4 transition-transform group-hover:scale-125" />
                Save 50% — Go Premium
              </Button>
            </DialogTrigger>
            <button
              onClick={() => setCollapsed(true)}
              aria-label="Minimize"
              className="relative flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          // Variant A: original blue pill
          <div className="flex items-center gap-1 rounded-full bg-primary pr-1 shadow-xl shadow-primary/30 ring-1 ring-primary/20">
            <DialogTrigger asChild>
              <Button
                size="lg"
                className={cn(
                  "group rounded-full bg-primary px-5 font-display font-semibold text-primary-foreground hover:bg-primary/90",
                  "shadow-none ring-0",
                )}
              >
                <Crown className="h-4 w-4 transition-transform group-hover:rotate-12" />
                Get Premium
              </Button>
            </DialogTrigger>
            <button
              onClick={() => setCollapsed(true)}
              aria-label="Minimize"
              className="flex h-8 w-8 items-center justify-center rounded-full text-primary-foreground/80 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Crown className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center font-display text-2xl font-bold">
            Unlock Unidealz Premium
          </DialogTitle>
          <p className="text-center text-sm text-muted-foreground">
            Just <span className="font-bold text-foreground">€3 / month</span> for the perks that matter most.
          </p>
        </DialogHeader>

        <ul className="my-4 space-y-3">
          {perks.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3 text-sm text-foreground">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-3.5 w-3.5 text-primary" />
              </span>
              <span>{text}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-2">
          <Button asChild size="lg" className="w-full rounded-xl font-semibold">
            <Link to="/premium" onClick={() => { track("conversion", { surface: "popup_upgrade" }); setOpen(false); }}>
              <Crown className="h-4 w-4" />
              Upgrade to Premium
            </Link>
          </Button>
          <button
            onClick={() => setOpen(false)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Maybe later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GetPremiumPopup;
