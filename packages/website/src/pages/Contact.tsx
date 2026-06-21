import { useState } from 'react';
import { z } from 'zod';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import Navbar from '@/components/Navbar';
import Footer from '@/components/home/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Mail, MessageCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { studentsImg } from '@/lib/assets';
import { useLanguage } from '@/hooks/useLanguage';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@unidealz/shared';
import { dashboardStudentHubUrl } from '@/lib/dashboardUrl';

const ticketSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  subject: z.string().trim().min(1).max(120),
  message: z.string().trim().min(5).max(2000),
});

const Contact = () => {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Verification Assistance');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const parsed = ticketSchema.safeParse({ name, email, subject, message });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, COLLECTIONS.supportTickets), {
        fullName: parsed.data.name,
        studentEmail: parsed.data.email,
        subject: parsed.data.subject,
        message: parsed.data.message,
        userId: null,
        status: 'open',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success(t('contact.form.success'), {
        description: t('contact.form.successDesc'),
      });
      setSubject('Verification Assistance');
      setMessage('');
      setName('');
      setEmail('');
    } catch {
      toast.error(t('contact.form.error'), {
        description: t('contact.form.errorDesc'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToForm = () => {
    setChatOpen(false);
    document.getElementById('full-name')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => document.getElementById('full-name')?.focus(), 400);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(0deg, #FCF8FE, #FCF8FE), hsl(var(--background))' }}
    >
      <Navbar />

      <main className="container flex-1 py-16 md:py-20">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.2em]" style={{ color: '#842CD3' }}>
          {t('contact.eyebrow')}
        </span>
        <div className="mt-4 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <h1 className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-foreground md:text-6xl lg:text-7xl">
            {t('contact.titleA')} <br />
            <span className="text-primary">{t('contact.titleB')}</span> {t('contact.titleC')}
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed lg:max-w-sm">
            {t('contact.subtitle')}
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-3xl bg-card p-7 shadow-sm md:p-9">
            <div className="flex items-center gap-2.5">
              <Mail className="h-5 w-5 text-primary" strokeWidth={2} />
              <h2 className="font-display text-xl font-bold text-foreground">{t('contact.form.title')}</h2>
            </div>

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full-name" className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                    {t('contact.form.name')}
                  </Label>
                  <Input
                    id="full-name"
                    placeholder={t('contact.form.namePlaceholder')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 rounded-xl border-border/60 bg-muted/40 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="student-email" className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                    {t('contact.form.email')}
                  </Label>
                  <Input
                    id="student-email"
                    type="email"
                    placeholder={t('contact.form.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-xl border-border/60 bg-muted/40 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  {t('contact.form.subject')}
                </Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger className="h-12 rounded-xl border-border/60 bg-muted/40 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Verification Assistance">{t('contact.form.subject.verification')}</SelectItem>
                    <SelectItem value="Claiming an Offer">{t('contact.form.subject.claim')}</SelectItem>
                    <SelectItem value="Account Issue">{t('contact.form.subject.account')}</SelectItem>
                    <SelectItem value="Merchant Portal Help">{t('contact.form.subject.merchant')}</SelectItem>
                    <SelectItem value="Technical Issue">{t('contact.form.subject.technical')}</SelectItem>
                    <SelectItem value="Other">{t('contact.form.subject.other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  {t('contact.form.message')}
                </Label>
                <Textarea
                  id="message"
                  placeholder={t('contact.form.messagePlaceholder')}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="rounded-xl border-border/60 bg-muted/40 text-sm resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="h-14 w-full rounded-2xl bg-gradient-to-r from-primary to-primary/80 font-display text-base font-semibold shadow-md hover:opacity-95"
              >
                {submitting ? t('contact.form.submitting') : t('contact.form.submit')}
              </Button>
            </form>
          </div>

          <div className="flex flex-col gap-6">
            <div
              className="relative overflow-hidden rounded-[32px] p-8"
              style={{ background: 'rgba(112, 115, 255, 0.1)' }}
            >
              <h3 className="font-display text-lg font-bold text-foreground">{t('contact.email.title')}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t('contact.email.body')}</p>
              <a
                href="mailto:support@unidealz.gr"
                className="mt-4 inline-block font-display text-base font-bold text-primary hover:underline"
              >
                support@unidealz.gr
              </a>
              <Mail
                className="absolute -bottom-2 -right-2 h-24 w-24 text-primary/20"
                strokeWidth={1.5}
              />
            </div>

            <div
              className="relative overflow-hidden rounded-[32px] p-8"
              style={{ background: 'rgba(111, 251, 190, 0.15)' }}
            >
              <h3 className="font-display text-lg font-bold text-foreground">{t('contact.chat.title')}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t('contact.chat.body')}</p>
              <Button
                type="button"
                onClick={() => setChatOpen(true)}
                className="mt-4 h-11 rounded-full bg-emerald-700 px-6 font-display text-sm font-semibold text-white hover:bg-emerald-800"
              >
                {t('contact.chat.cta')}
              </Button>
              <MessageCircle
                className="absolute -bottom-2 -right-2 h-24 w-24 text-emerald-700/20"
                strokeWidth={1.5}
              />
            </div>
          </div>
        </div>

        <div className="relative mt-14 overflow-hidden rounded-3xl bg-muted/50 p-8 sm:p-12 md:p-14">
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div className="relative z-10">
              <h3 className="font-display text-2xl font-extrabold tracking-tight text-foreground md:text-3xl lg:text-4xl">
                {t('contact.cta.titleA')} <br />
                {t('contact.cta.titleB')}
              </h3>
              <p className="mt-4 max-w-md text-sm text-muted-foreground leading-relaxed">
                {t('contact.cta.body')}
              </p>
              <Button
                onClick={() => { window.location.href = dashboardStudentHubUrl; }}
                className="mt-6 h-12 rounded-full bg-foreground px-7 font-display text-sm font-semibold text-background hover:bg-foreground/90"
              >
                {t('contact.cta.button')}
              </Button>
            </div>
            <div className="relative h-48 sm:h-56 lg:h-full lg:min-h-[220px]">
              <img
                src={studentsImg}
                alt={t('contact.cta.image.alt')}
                className="absolute inset-0 h-full w-full rounded-2xl object-cover opacity-30 grayscale"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{t('contact.chat.modal.title')}</DialogTitle>
            <DialogDescription>{t('contact.chat.modal.body')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setChatOpen(false);
                window.location.href = 'mailto:support@unidealz.gr';
              }}
              className="rounded-full"
            >
              {t('contact.chat.modal.email')}
            </Button>
            <Button onClick={scrollToForm} className="rounded-full">
              {t('contact.chat.modal.ticket')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Contact;
