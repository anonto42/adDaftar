import { useCallback } from 'react';
import { useAppStore } from '@/src/store';
import { translations, TranslationKey, LanguageCode } from './translations';

export function useI18n() {
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);

  const t = useCallback((key: TranslationKey): string => {
    const lang = language || 'en';
    const translation = translations[lang as LanguageCode] || translations.en;
    return translation[key] || translations.en[key] || key;
  }, [language]);

  return { t, language, setLanguage, translations };
}
