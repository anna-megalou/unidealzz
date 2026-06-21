import { pigIcon } from '@/lib/assets';
import { useLanguage } from '@/hooks/useLanguage';

const StatsSection = () => {
  const { t } = useLanguage();
  return (
    <section className="py-20">
      <div className="container">
        <div className="relative overflow-hidden rounded-2xl bg-foreground p-8 sm:p-12 lg:p-16">
          <div className="relative z-10 grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-background sm:text-3xl lg:text-4xl">
                {t('stats.titleA')}{' '}
                <br />
                <span className="text-primary">{t('stats.titleB')}</span>
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-background/70">
                {t('stats.subtitle')}
              </p>
              <div className="mt-8 flex gap-10">
                <div>
                  <p className="font-display text-3xl font-extrabold text-background">100+</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-background/60">{t('stats.brands')}</p>
                </div>
                <div>
                  <p className="font-display text-3xl font-extrabold text-background">1k€</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-background/60">{t('stats.savings')}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center lg:justify-end">
              <img
                src={pigIcon}
                alt={t('stats.image.alt')}
                className="h-80 w-80 object-contain opacity-15 brightness-0 invert sm:h-96 sm:w-96"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
