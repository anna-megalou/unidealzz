import { Link, useLocation } from 'react-router-dom';
import { Menu, X, UserCircle, Search, Globe } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { dashboardLoginUrl, dashboardSignupUrl } from '@/lib/dashboardUrl';
import { logo } from '@/lib/assets';

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { language, toggleLanguage, t } = useLanguage();

  const links = [
    { to: '/', label: t('nav.home') },
    { to: '/offers', label: t('nav.offers') },
    { to: '/about', label: t('nav.about') },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-foreground tracking-tight">
            <img src={logo} alt="Unidealz logo" className="h-7 w-7 rounded-md" />
            Unidealz
          </Link>

          <div className="hidden items-center gap-6 sm:flex">
            {links.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === l.to ? 'text-primary underline underline-offset-4' : 'text-muted-foreground'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden items-center gap-4 sm:flex">
          <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5">
            <Search size={14} className="text-muted-foreground" />
            <input type="text" placeholder={t('nav.searchPlaceholder')} className="w-32 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none" />
          </div>
          <button
            onClick={toggleLanguage}
            aria-label="Toggle language"
            className="flex items-center gap-1 rounded-full border bg-card px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <Globe size={14} />
            {language === 'en' ? 'EN' : 'GR'}
          </button>
          <a href={dashboardLoginUrl} aria-label="Log in">
            <UserCircle size={20} className="text-muted-foreground" />
          </a>
        </div>

        <button className="sm:hidden text-foreground" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t bg-background sm:hidden">
          {links.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              onClick={() => setOpen(false)}
              className={`block px-4 py-3 text-sm font-medium transition-colors hover:bg-muted ${
                location.pathname === l.to ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={() => { toggleLanguage(); }}
            className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground"
          >
            <Globe size={16} />
            {t('nav.languageLabel')}: {language === 'en' ? t('nav.languageEn') : t('nav.languageEl')}
          </button>
          <a href={dashboardLoginUrl} className="block px-4 py-3 text-sm font-medium text-muted-foreground">{t('nav.login')}</a>
          <a href={dashboardSignupUrl} className="block px-4 py-3 text-sm font-medium text-primary">{t('nav.signup')}</a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
