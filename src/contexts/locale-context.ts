import { createContext } from 'react';
import { type Locale, type Dictionary } from '@/i18n/dictionary';

export interface LocaleContextType {
	locale: Locale;
	setLocale: (locale: Locale) => void;
	t: Dictionary;
	isRTL: boolean;
}

export const LocaleContext = createContext<LocaleContextType | null>(null);
