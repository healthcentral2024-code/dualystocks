import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  translations,
  locales,
  type Lang,
  type TranslationKey,
} from "@/lib/translations";

const STORAGE_KEY = "tradesage-lang";
const DEFAULT_LANG: Lang = "en";

function readStoredLang(): Lang {
  if (typeof window === "undefined") return DEFAULT_LANG;
  try {
    // ?lang=es|en overrides the stored preference (useful for shared links)
    const fromQuery = new URLSearchParams(window.location.search).get("lang");
    if (fromQuery === "es" || fromQuery === "en") return fromQuery;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "es" || stored === "en") return stored;
  } catch {
    // ignore storage access errors
  }
  return DEFAULT_LANG;
}

export function getStoredLang(): Lang {
  return readStoredLang();
}

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
  locale: string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => readStoredLang());

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore storage access errors
    }
  }, []);

  const value = useMemo<LanguageContextValue>(() => {
    const t = (key: TranslationKey) => {
      const entry = translations[key];
      return entry ? entry[lang] : (key as string);
    };
    return { lang, setLang, t, locale: locales[lang] };
  }, [lang, setLang]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
