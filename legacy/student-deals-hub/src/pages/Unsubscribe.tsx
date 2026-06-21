import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/home/Footer";
import { Button } from "@/components/ui/button";
import { Loader2, MailX, CheckCircle2, AlertCircle } from "lucide-react";

type Status =
  | "validating"
  | "valid"
  | "already"
  | "invalid"
  | "submitting"
  | "success"
  | "error";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
const FN_URL = `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe`;

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<Status>("validating");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${FN_URL}?token=${encodeURIComponent(token)}`, {
          headers: { apikey: SUPABASE_ANON },
        });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setStatus("invalid");
          return;
        }
        if (json?.valid === false && json?.reason === "already_unsubscribed") {
          setStatus("already");
        } else if (json?.valid === true) {
          setStatus("valid");
        } else {
          setStatus("invalid");
        }
      } catch {
        if (!cancelled) setStatus("invalid");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleConfirm = async () => {
    if (!token) return;
    setStatus("submitting");
    try {
      const res = await fetch(FN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON,
        },
        body: JSON.stringify({ token }),
      });
      const json = await res.json();
      if (!res.ok) {
        setStatus("error");
        return;
      }
      if (json?.success || json?.reason === "already_unsubscribed") {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="container max-w-xl flex-1 py-16 md:py-24">
        <div className="rounded-3xl border bg-card p-8 text-center shadow-sm md:p-12">
          {status === "validating" && (
            <>
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
              <h1 className="mt-6 font-display text-2xl font-bold">
                Checking your link…
              </h1>
            </>
          )}

          {status === "valid" && (
            <>
              <MailX className="mx-auto h-10 w-10 text-primary" />
              <h1 className="mt-6 font-display text-2xl font-bold">
                Unsubscribe from Unidealz emails
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">
                You'll stop receiving marketing and update emails from us.
                Important account-related emails (verification, security) will
                still be delivered.
              </p>
              <Button
                onClick={handleConfirm}
                className="mt-8 h-12 rounded-full px-8 font-display font-semibold"
              >
                Confirm Unsubscribe
              </Button>
            </>
          )}

          {status === "submitting" && (
            <>
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
              <h1 className="mt-6 font-display text-2xl font-bold">
                Processing…
              </h1>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
              <h1 className="mt-6 font-display text-2xl font-bold">
                You've been unsubscribed
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">
                We're sorry to see you go. You can re-enable emails anytime
                from your account settings.
              </p>
            </>
          )}

          {status === "already" && (
            <>
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
              <h1 className="mt-6 font-display text-2xl font-bold">
                Already unsubscribed
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">
                This email address is already removed from our mailing list.
              </p>
            </>
          )}

          {(status === "invalid" || status === "error") && (
            <>
              <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
              <h1 className="mt-6 font-display text-2xl font-bold">
                Link not valid
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">
                This unsubscribe link is invalid or has expired. Please use
                the link from your most recent email, or contact support.
              </p>
              <a
                href="mailto:support@unidealz.gr"
                className="mt-6 inline-block text-sm font-semibold text-primary hover:underline"
              >
                support@unidealz.gr
              </a>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Unsubscribe;
