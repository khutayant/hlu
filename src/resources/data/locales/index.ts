import flagEn from '../../../assets/svgs/flag-en.svg';
import flagMm from '../../../assets/svgs/flag-mm.svg';
import en from './en';
import mm from './mm';

export const LOCALES = {
  en,
  mm,
} as const;

export type LocaleCode = keyof typeof LOCALES;
export type LocaleMessages = (typeof LOCALES)[LocaleCode];

/** Fixed labels — do not translate with the active locale. */
export const LOCALE_OPTIONS: {
  code: LocaleCode;
  label: string;
  flag: string;
}[] = [
  { code: 'en', label: 'Eng', flag: flagEn },
  { code: 'mm', label: 'မြန်မာ', flag: flagMm },
];

export const DEFAULT_LOCALE: LocaleCode = 'mm';
