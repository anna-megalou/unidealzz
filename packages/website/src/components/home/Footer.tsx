import { Link } from 'react-router-dom';

import { useLanguage } from '@/hooks/useLanguage';
import { openCookiePreferences } from '@/components/cookies/cookiePreferences';
import { logo } from '@/lib/assets';

const Footer = () => {
  const { t } = useLanguage();
  return (
    <footer className="border-t bg-card">
      <div className="container py-10">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <Link to="/" className="flex items-center gap-2.5">
              <img src={logo} alt="Unidealz" className="h-8 w-8 rounded-md" />
              <span className="font-display text-xl font-bold text-primary">Unidealz</span>
            </Link>
            <p className="mt-2 text-xs text-muted-foreground">
              {t('footer.tagline')}
            </p>
          </div>

          <nav className="flex flex-wrap items-center justify-start gap-x-6 gap-y-2 text-sm text-muted-foreground md:justify-end">
            <Link to="/terms" className="transition-colors hover:text-foreground">{t('footer.terms')}</Link>
            <Link to="/privacy" className="transition-colors hover:text-foreground">{t('footer.privacy')}</Link>
            <Link to="/cookies" className="transition-colors hover:text-foreground">Cookie Policy</Link>
            <button
              type="button"
              onClick={openCookiePreferences}
              className="transition-colors hover:text-foreground"
            >
              Cookie Preferences
            </button>
            <Link to="/contact" className="transition-colors hover:text-foreground">{t('footer.contact')}</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
