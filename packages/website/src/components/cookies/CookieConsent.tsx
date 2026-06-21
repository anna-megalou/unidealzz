import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  CookiePreferences,
  OPEN_PREFS_EVENT,
  allAccepted,
  defaultPreferences,
  getStoredPreferences,
  savePreferences,
} from './cookiePreferences';

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState<CookiePreferences>(defaultPreferences);

  useEffect(() => {
    const stored = getStoredPreferences();
    if (stored) {
      setPrefs(stored);
    } else {
      setShowBanner(true);
    }

    const handleOpen = () => {
      setPrefs(getStoredPreferences() ?? defaultPreferences);
      setShowPrefs(true);
    };
    window.addEventListener(OPEN_PREFS_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_PREFS_EVENT, handleOpen);
  }, []);

  const persist = (next: CookiePreferences) => {
    savePreferences(next);
    setPrefs(next);
    setShowBanner(false);
    setShowPrefs(false);
  };

  const acceptAll = () => persist(allAccepted);
  const denyNonEssential = () => persist(defaultPreferences);
  const savePrefs = () => persist({ ...prefs, essential: true });

  return (
    <>
      {showBanner && (
        <div
          className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-3 sm:px-6 sm:pb-6"
          role="dialog"
          aria-live="polite"
          aria-label="Cookie consent"
        >
          <div className="mx-auto max-w-3xl rounded-2xl border bg-card/95 p-5 shadow-lg backdrop-blur md:p-6">
            <div className="flex items-start gap-4">
              <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary sm:flex">
                <Cookie className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h2 className="font-display text-base font-semibold text-foreground">
                  We value your privacy
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  We use cookies to keep Unidealz running smoothly, remember
                  your preferences, and understand how the platform is used.
                  You can choose what to allow. See our{" "}
                  <Link to="/cookies" className="text-primary hover:underline">
                    Cookie Policy
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button size="sm" onClick={acceptAll}>
                    Accept all
                  </Button>
                  <Button size="sm" variant="outline" onClick={denyNonEssential}>
                    Deny non-essential
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowPrefs(true)}
                  >
                    Manage preferences
                  </Button>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={denyNonEssential}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={showPrefs} onOpenChange={setShowPrefs}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Cookie preferences</DialogTitle>
            <DialogDescription>
              Choose which categories of cookies Unidealz can use. Essential
              cookies are required for the platform to function and cannot be
              disabled.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <PreferenceRow
              title="Essential"
              description="Required for authentication, security, and remembering your cookie choice."
              checked
              disabled
            />
            <PreferenceRow
              title="Analytics"
              description="Help us understand how the platform is used so we can improve it."
              checked={prefs.analytics}
              onChange={(v) => setPrefs((p) => ({ ...p, analytics: v }))}
            />
            <PreferenceRow
              title="Functional"
              description="Remember preferences such as language and saved offers."
              checked={prefs.functional}
              onChange={(v) => setPrefs((p) => ({ ...p, functional: v }))}
            />
            <PreferenceRow
              title="Marketing"
              description="Used to measure marketing performance and personalize content (off by default)."
              checked={prefs.marketing}
              onChange={(v) => setPrefs((p) => ({ ...p, marketing: v }))}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={denyNonEssential}>
              Deny non-essential
            </Button>
            <Button variant="outline" onClick={acceptAll}>
              Accept all
            </Button>
            <Button onClick={savePrefs}>Save preferences</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

interface PreferenceRowProps {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}

const PreferenceRow = ({
  title,
  description,
  checked,
  disabled,
  onChange,
}: PreferenceRowProps) => (
  <div className="flex items-start justify-between gap-4 rounded-xl border bg-background p-4">
    <div className="flex-1">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
    <Switch
      checked={checked}
      disabled={disabled}
      onCheckedChange={(v) => onChange?.(!!v)}
      aria-label={`${title} cookies`}
    />
  </div>
);

export default CookieConsent;
