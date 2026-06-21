import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  translations,
  type Language,
  type TranslationKey,
} from '@unidealz/shared';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = 'unidealz.language.v2';
const LEGACY_STORAGE_KEY = 'unidealz.language';

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'en';
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'el' || stored === 'en' ? stored : 'en';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => setLanguageState(lang);
  const toggleLanguage = () => setLanguageState((l) => (l === 'en' ? 'el' : 'en'));

  const t = useCallback(
    (key: TranslationKey) => {
      const dict = translations[language] as Record<string, string>;
      return dict[key] ?? (translations.en as Record<string, string>)[key] ?? key;
    },
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, toggleLanguage, t }),
    [language, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};

export type { Language, TranslationKey };
