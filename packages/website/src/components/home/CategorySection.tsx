import { categories } from '@/data/offers';
import { ArrowRight, Coffee, UtensilsCrossed, Shirt, Monitor, Plane } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import type { TranslationKey } from '@unidealz/shared';

const categoryLucideIcons: Record<string, React.ReactNode> = {
  Coffee: <Coffee className="h-6 w-6" />,
  Food: <UtensilsCrossed className="h-6 w-6" />,
  Fashion: <Shirt className="h-6 w-6" />,
  Technology: <Monitor className="h-6 w-6" />,
  Travel: <Plane className="h-6 w-6" />,
};

const CategorySection = () => {
  const { t } = useLanguage();
  return (
    <section className="border-t bg-muted/30 py-20">
      <div className="container">
        <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t('cat.title')}
            </h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              {t('cat.subtitle')}
            </p>
          </div>
          <Link
            to="/offers"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            {t('cat.viewAll')}
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat) => {
            const nameKey = `cat.name.${cat}` as TranslationKey;
            const descKey = `cat.desc.${cat}` as TranslationKey;
            return (
              <Link
                key={cat}
                to={`/offers?category=${cat}`}
                className="group flex flex-col gap-3 rounded-xl border bg-card p-6 transition-all hover:shadow-md hover:border-primary/30"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  {categoryLucideIcons[cat]}
                </div>
                <h3 className="font-display text-lg font-bold text-foreground">{t(nameKey)}</h3>
                <p className="text-sm text-muted-foreground">{t(descKey)}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
