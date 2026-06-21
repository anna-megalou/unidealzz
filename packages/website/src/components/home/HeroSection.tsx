import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, ShoppingBag } from 'lucide-react';
import { heroImage } from '@/lib/assets';
import { useLanguage } from '@/hooks/useLanguage';

const HeroSection = () => {
  const { t } = useLanguage();
  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      <div className="container">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
              <Sparkles size={14} />
              {t('hero.eyebrow')}
            </span>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {t('hero.titleA')}{' '}
              <br />
              <span className="text-primary">{t('hero.titleB')}</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
              {t('hero.subtitle')}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/offers">
                <Button size="lg" className="rounded-full font-semibold text-base px-8">
                  {t('hero.cta.explore')}
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button size="lg" variant="outline" className="rounded-full font-semibold text-base px-8">
                  {t('hero.cta.howItWorks')}
                </Button>
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-2xl">
              <img
                src={heroImage}
                alt={t('hero.image.alt')}
                className="h-auto w-full object-cover"
              />
            </div>
            <div className="absolute right-0 top-4 flex items-center gap-3 rounded-xl border bg-card p-3 shadow-lg sm:right-[-12px]">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShoppingBag size={18} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-semibold uppercase text-primary">{t('hero.badge.label')}</p>
                <p className="text-sm font-bold text-foreground">{t('hero.badge.value')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
