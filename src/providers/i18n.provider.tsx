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
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_OPTIONS,
  type LocaleCode,
  type LocaleMessages,
} from '../resources/data/locales';

const STORAGE_KEY = 'hlu-locale';

type TranslateParams = Record<string, string | number>;

type I18nContextValue = {
  locale: LocaleCode;
  setLocale: (locale: LocaleCode) => void;
  messages: LocaleMessages;
  options: typeof LOCALE_OPTIONS;
  t: (key: string, params?: TranslateParams) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function isLocaleCode(value: string | null): value is LocaleCode {
  return value === 'en' || value === 'mm';
}

function readStoredLocale(): LocaleCode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLocaleCode(stored)) {
      return stored;
    }
  } catch {
    // ignore storage errors
  }
  return DEFAULT_LOCALE;
}

function getMessageByPath(messages: LocaleMessages, key: string): string | null {
  const parts = key.split('.');
  let current: unknown = messages;

  for (const part of parts) {
    if (!current || typeof current !== 'object' || !(part in current)) {
      return null;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === 'string' ? current : null;
}

function interpolate(template: string, params?: TranslateParams): string {
  if (!params) {
    return template;
  }
  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) => {
    const value = params[name];
    return value === undefined || value === null ? `{{${name}}}` : String(value);
  });
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(() => readStoredLocale());

  const setLocale = useCallback((next: LocaleCode) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === 'mm' ? 'my' : 'en';
  }, [locale]);

  const messages = LOCALES[locale];

  const t = useCallback(
    (key: string, params?: TranslateParams) => {
      const fromCurrent = getMessageByPath(messages, key);
      if (fromCurrent !== null) {
        return interpolate(fromCurrent, params);
      }
      const fromFallback = getMessageByPath(LOCALES[DEFAULT_LOCALE], key);
      if (fromFallback !== null) {
        return interpolate(fromFallback, params);
      }
      return key;
    },
    [messages],
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      messages,
      options: LOCALE_OPTIONS,
      t,
    }),
    [locale, messages, setLocale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used inside I18nProvider');
  }
  return context;
}
