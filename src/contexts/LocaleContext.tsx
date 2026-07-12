import { useState, useEffect, type ReactNode } from 'react';
import { type Locale, getDictionary } from '@/i18n/dictionary';
import { supabase } from '@/integrations/supabase/client';
import { LocaleContext } from '@/contexts/locale-context';

export function LocaleProvider({ children }: { children: ReactNode }) {
	const [locale, setLocaleState] = useState<Locale>(() => {
		// Try to get from localStorage first
		const stored = localStorage.getItem('neon-academy-locale');
		if (stored === 'en' || stored === 'he') return stored;
		return 'en';
	});
	
	const t = getDictionary(locale);
	const isRTL = locale === 'he';
	
	// Update document direction and lang
	useEffect(() => {
		document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
		document.documentElement.lang = locale;
	}, [locale, isRTL]);
	
	const setLocale = async (newLocale: Locale) => {
		setLocaleState(newLocale);
		localStorage.setItem('neon-academy-locale', newLocale);
		
		// Try to persist to profile if logged in
		if (supabase) {
			const { data: { user } } = await supabase.auth.getUser();
			if (user) {
				await supabase
					.from('profiles')
					.update({ locale: newLocale })
					.eq('id', user.id);
			}
		}
	};
	
	return (
		<LocaleContext.Provider value={{ locale, setLocale, t, isRTL }}>
			{children}
		</LocaleContext.Provider>
	);
}
