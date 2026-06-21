import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Search, ChevronDown, Crown, Sparkles, Lock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/home/Footer';
import { useOffers, type DbOffer } from '@/hooks/queries';
import { offers as mockOffers } from '@/data/offers';
import FavoriteButton from '@/components/FavoriteButton';
import ShareButtons from '@/components/ShareButtons';
import { useLanguage } from '@/hooks/useLanguage';
import { useABTest } from '@/hooks/useABTest';
import type { TranslationKey } from '@unidealz/shared';
import { brandImages } from '@/lib/assets';
import { dashboardSignupUrl } from '@/lib/dashboardUrl';

const categoryBadgeColors: Record<string, string> = {
  Coffee: 'bg-category-coffee text-white',
  Food: 'bg-category-food text-white',
  Fashion: 'bg-category-fashion text-white',
  Technology: 'bg-primary text-primary-foreground',
  Travel: 'bg-accent text-accent-foreground',
  Trending: 'bg-primary text-primary-foreground',
  BOOKS: 'bg-category-books text-white',
};

const filterTabs: { value: string; labelKey: TranslationKey }[] = [
  { value: 'All Offers', labelKey: 'offers.filter.all' },
  { value: 'Technology', labelKey: 'offers.filter.tech' },
  { value: 'Coffee', labelKey: 'offers.filter.coffee' },
  { value: 'Fashion', labelKey: 'offers.filter.fashion' },
  { value: 'Food', labelKey: 'offers.filter.food' },
];

const mockDbOffers: DbOffer[] = mockOffers.map((o) => ({
  id: o.id,
  title: o.title,
  description: o.description,
  discount_label: o.discountLabel ?? o.title,
  discount_percent: o.discount,
  discount_code: null,
  redirect_url: null,
  image_url: null,
  terms: o.terms,
  featured: !!o.featured,
  active: true,
  expires_at: o.expirationDate,
  scope: 'national',
  university_ids: [],
  brand: { id: o.id, name: o.storeName, slug: o.storeName.toLowerCase(), logo_url: null },
  category: { id: o.category, name: o.category, slug: o.category.toLowerCase() },
}));

const Offers = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const initialCat = searchParams.get('category');
  const [activeFilter, setActiveFilter] = useState<string>(initialCat ?? 'All Offers');
  const [search, setSearch] = useState('');
  const { data: dbOffers = [], isLoading } = useOffers();
  const offers = dbOffers.length > 0 ? dbOffers : mockDbOffers;

  const filtered = useMemo(() => {
    return offers.filter((o) => {
      const matchesCat = activeFilter === 'All Offers' || o.category?.name === activeFilter;
      const term = search.toLowerCase();
      const matchesSearch =
        !term ||
        o.brand?.name.toLowerCase().includes(term) ||
        o.title.toLowerCase().includes(term);
      return matchesCat && matchesSearch;
    });
  }, [offers, activeFilter, search]);

  const featuredOffer = filtered.find((o) => o.featured);
  const regularOffers = filtered.filter((o) => !o.featured).slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(0deg, #FCF8FE, #FCF8FE), hsl(var(--background))' }}>
      <Navbar />

      <div className="container flex-1 py-10">
        <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl">
          {t('offers.titleA')}{' '}
          <br />
          <span className="text-primary">{t('offers.titleB')}</span>
        </h1>
        <p className="mt-4 max-w-lg text-base text-muted-foreground">
          {t('offers.subtitleA')}<br />{t('offers.subtitleB')}
        </p>

        <div className="mt-8 flex items-center gap-3 rounded-xl border bg-card px-4 py-3 max-w-lg">
          <Search size={18} className="text-muted-foreground" />
          <input
            type="text"
            placeholder={t('offers.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveFilter(tab.value)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                activeFilter === tab.value
                  ? 'bg-primary text-primary-foreground'
                  : 'border bg-card text-muted-foreground hover:border-primary/40'
              }`}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </div>

        <PremiumUnlockBanner />

        <div className="mt-6">
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6 max-w-2xl">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Lock size={20} />
              </span>
              <div className="flex-1">
                <h3 className="font-display text-lg font-bold text-foreground">
                  Unlock offers near your university
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sign up with your university email to see personalized student deals based on your campus.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <a href={dashboardSignupUrl}>
                    <Button className="rounded-full px-5">Sign up to unlock</Button>
                  </a>
                  <a
                    href="#all-offers"
                    className="text-sm font-semibold text-primary underline-offset-2 hover:underline"
                  >
                    Browse general offers
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {isLoading && <p className="mt-10 text-sm text-muted-foreground">{t('offers.loading')}</p>}

        {!isLoading && featuredOffer && (
          <div id="all-offers" className="mt-10 grid gap-6 lg:grid-cols-[1fr_1fr_1fr]">
            <div className="lg:col-span-2 grid gap-6 sm:grid-cols-2 rounded-2xl border bg-card p-6">
              <div className="flex flex-col justify-between">
                <div>
                  <span className={`inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase ${categoryBadgeColors.Trending}`}>
                    {t('offers.trending')}
                  </span>
                  <h2 className="mt-4 font-display text-2xl font-bold text-foreground">{featuredOffer.brand?.name}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{featuredOffer.description}</p>
                  <h3 className="mt-4 font-display text-xl font-bold text-primary">
                    {featuredOffer.discount_label || featuredOffer.title}
                  </h3>
                </div>
                <div className="mt-6">
                  <Link to={`/offers/${featuredOffer.id}`}>
                    <Button className="rounded-full px-6">{t('offers.viewOffer')}</Button>
                  </Link>
                </div>
              </div>
              {brandImages[featuredOffer.brand?.name ?? ''] && (
                <div className="relative overflow-hidden rounded-xl">
                  <img
                    src={brandImages[featuredOffer.brand!.name]}
                    alt={featuredOffer.brand?.name}
                    className="h-full w-full object-cover"
                  />
                  <FavoriteButton offerId={featuredOffer.id} className="absolute right-3 top-3" />
                </div>
              )}
            </div>

            {regularOffers[0] && <OfferCardWithImage offer={regularOffers[0]} />}
          </div>
        )}

        {!isLoading && regularOffers.length > 1 && (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {regularOffers.slice(1, 4).map((offer) => (
              <OfferCardWithImage key={offer.id} offer={offer} />
            ))}
          </div>
        )}

        <div className="mt-12 flex justify-center">
          <Button variant="outline" className="rounded-full gap-2 px-8">
            {t('offers.exploreMore')}
            <ChevronDown size={16} />
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
};

function OfferCardWithImage({ offer }: { offer: DbOffer }) {
  const { t } = useLanguage();
  const image = offer.image_url || brandImages[offer.brand?.name ?? ''];
  const cat = offer.category?.name ?? '';
  const badgeColor = categoryBadgeColors[cat] || 'bg-muted text-muted-foreground';
  const catLabelKey: TranslationKey | null =
    cat === 'Technology' ? 'offers.filter.tech'
    : cat === 'Coffee' ? 'offers.filter.coffee'
    : cat === 'Fashion' ? 'offers.filter.fashion'
    : cat === 'Food' ? 'offers.filter.food'
    : null;
  const catLabel = catLabelKey ? t(catLabelKey) : cat;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border bg-card">
      {image && (
        <div className="relative h-48 overflow-hidden">
          <img src={image} alt={offer.brand?.name} className="h-full w-full object-cover" />
          <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[10px] font-bold uppercase ${badgeColor}`}>
            {catLabel}
          </span>
          <FavoriteButton offerId={offer.id} className="absolute right-3 top-3" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-base font-bold text-foreground">{offer.brand?.name}</h3>
        <p className="mt-1 text-sm font-semibold text-primary">
          {offer.discount_label || offer.title}
        </p>
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{offer.description}</p>
        <div className="mt-auto pt-4 space-y-3">
          <ShareButtons
            url={`/offers/${offer.id}`}
            title={`${offer.brand?.name ?? ''} — ${offer.title}`}
            discount={offer.discount_label ?? undefined}
          />
          <Link to={`/offers/${offer.id}`}>
            <Button variant="outline" className="w-full rounded-full">{t('offers.viewOffer')}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function PremiumUnlockBanner() {
  const { variant, track } = useABTest('premium_cta_v1');
  if (variant !== 'B') return null;

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary to-primary/80 p-6 shadow-xl shadow-primary/20 sm:p-8">
      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30">
            <Crown className="h-6 w-6 text-primary-foreground" />
          </span>
          <div>
            <h3 className="font-display text-xl font-bold text-primary-foreground sm:text-2xl">
              Unlock More Offers With Premium
            </h3>
            <p className="mt-1 max-w-xl text-sm text-primary-foreground/90">
              Get exclusive premium-only discounts, early access to flash sales, and notified first about new drops — just €3/month.
            </p>
          </div>
        </div>
        <Link
          to="/premium"
          onClick={() => track('conversion', { surface: 'offers_banner_upgrade' })}
          className="shrink-0"
        >
          <Button size="lg" className="rounded-full bg-white px-6 font-display font-semibold text-primary hover:bg-white/90">
            <Sparkles className="h-4 w-4" />
            Go Premium
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default Offers;
