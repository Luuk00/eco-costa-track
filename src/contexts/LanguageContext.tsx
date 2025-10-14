import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { translations, Language } from '@/i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<Language>('pt-BR');

  useEffect(() => {
    if (user) {
      supabase
        .from('user_preferences')
        .select('language')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.language) {
            setLanguageState(data.language as Language);
          }
        });
    }
  }, [user]);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    if (user) {
      await supabase
        .from('user_preferences')
        .upsert({ user_id: user.id, language: lang }, { onConflict: 'user_id' });
    }
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
