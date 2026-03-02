import { createContext, useContext, useState, useCallback } from 'react';
import { carePlanTranslations } from '@/config/carePlanTranslations';

const LanguageContext = createContext({ language: 'en', setLanguage: () => {}, t: (key) => key });

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem('carePlanLanguage') || 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = useCallback((lang) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('carePlanLanguage', lang);
    } catch {
      // localStorage not available
    }
  }, []);

  const t = useCallback((key) => {
    const translations = carePlanTranslations[language] || carePlanTranslations.en;
    return translations[key] || carePlanTranslations.en[key] || key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
