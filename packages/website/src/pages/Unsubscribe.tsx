import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/home/Footer';
import { Button } from '@/components/ui/button';
import { Loader2, MailX, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  callConfirmEmailUnsubscribe,
  callValidateEmailUnsubscribe,
} from '@/lib/firebase';

type Status =
  | 'validating'
  | 'valid'
  | 'already'
  | 'invalid'
  | 'submitting'
  | 'success'
  | 'error';

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<Status>('validating');

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const result = await callValidateEmailUnsubscribe({ token });
        const json = result.data;
        if (cancelled) return;
        if (!json.valid) {
          setStatus(json.reason === 'already_unsubscribed' ? 'already' : 'invalid');
          return;
        }
        setStatus('valid');
      } catch {
        if (!cancelled) setStatus('invalid');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleConfirm = async () => {
    if (!token) return;
    setStatus('submitting');
    try {
      const result = await callConfirmEmailUnsubscribe({ token });
      const json = result.data;
      if (json.success || json.reason === 'already_unsubscribed') {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="container max-w-xl flex-1 py-16 md:py-24">
        <div className="rounded-3xl border bg-card p-8 text-center shadow-sm md:p-12">
          {status === 'validating' && (
            <>
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
              <h1 className="mt-6 font-display text-2xl font-bold">
                Checking your link…
              </h1>
            </>
          )}

          {status === 'valid' && (
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

          {status === 'submitting' && (
            <>
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
              <h1 className="mt-6 font-display text-2xl font-bold">
                Processing…
              </h1>
            </>
          )}

          {status === 'success' && (
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

          {status === 'already' && (
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

          {(status === 'invalid' || status === 'error') && (
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
