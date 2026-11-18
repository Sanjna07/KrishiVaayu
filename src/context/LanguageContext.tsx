'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations, type Language, type Translations } from '@/lib/translations';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: translations.en,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('krishivayu_lang');
      if (saved === 'hi' || saved === 'pa' || saved === 'en') {
        setLangState(saved);
      }
    } catch {
      // ignore
    }

    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<Language>;
      if (customEvent.detail && (customEvent.detail === 'en' || customEvent.detail === 'hi' || customEvent.detail === 'pa')) {
        setLangState(customEvent.detail);
      }
    };

    window.addEventListener('krishivayu-lang-changed', handleCustomChange);
    return () => window.removeEventListener('krishivayu-lang-changed', handleCustomChange);
  }, []);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem('krishivayu_lang', newLang);
      window.dispatchEvent(new CustomEvent('krishivayu-lang-changed', { detail: newLang }));
    } catch {
      // ignore
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] || translations.en }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
