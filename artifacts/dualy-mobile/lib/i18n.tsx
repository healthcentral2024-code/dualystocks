import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GetAnalysisLang } from '@workspace/api-client-react';

export type Language = 'en' | 'es';

type LanguageContextType = {
  lang: Language;
  setLang: (lang: Language) => void;
  apiLang: GetAnalysisLang;
};

const LanguageContext = createContext<LanguageContextType>({
  lang: 'es',
  setLang: () => {},
  apiLang: 'es' as GetAnalysisLang,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('es');

  useEffect(() => {
    AsyncStorage.getItem('dualy_lang').then((stored) => {
      if (stored === 'en' || stored === 'es') {
        setLangState(stored);
      }
    });
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    AsyncStorage.setItem('dualy_lang', newLang);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, apiLang: lang as GetAnalysisLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}