import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { withTimeout } from '@/utils/fetchWithTimeout';
import { useLocale } from '@/hooks/useLocale';

export interface OrgSettings {
	orgName: string | null;
	logoUrl: string | null;
	defaultLocale: 'en' | 'he';
}

const FALLBACK: OrgSettings = { orgName: null, logoUrl: null, defaultLocale: 'en' };

// Org branding is ONE row that changes almost never, read by four components. Cache it at
// module level so a page load costs a single request no matter how many of them mount.
//
// ⚠️ Deliberately a hook, NOT a provider. LocaleProvider wraps every route including
// /sandbox, and Sandbox making ZERO backend calls is a verified Build B property. Sandbox
// renders none of the branding components, so it never triggers this fetch.
let cache: OrgSettings | null = null;
let inFlight: Promise<OrgSettings> | null = null;
let localeApplied = false;

async function loadOrgSettings(): Promise<OrgSettings> {
	if (!supabase) return FALLBACK;
	try {
		const { data, error } = await withTimeout(
			supabase.
			from('org_settings').
			select('org_name, logo_url, default_locale').
			limit(1).
			maybeSingle(),
			10000
		);
		if (error) {
			console.error('Failed to load org settings:', error);
			return FALLBACK;
		}
		if (!data) return FALLBACK;
		return {
			orgName: data.org_name?.trim() || null,
			logoUrl: data.logo_url?.trim() || null,
			defaultLocale: data.default_locale === 'he' ? 'he' : 'en'
		};
	} catch (err) {
		console.error('Failed to load org settings:', err);
		return FALLBACK;
	}
}

export function useOrgSettings(): OrgSettings {
	const { applyLocale } = useLocale();
	const [settings, setSettings] = useState<OrgSettings>(cache ?? FALLBACK);

	useEffect(() => {
		if (cache) return;
		let alive = true;

		inFlight = inFlight ?? loadOrgSettings();
		void inFlight.then((loaded) => {
			cache = loaded;
			inFlight = null;

			// The org default applies ONLY to a visitor who has never chosen a locale.
			// An explicit choice in localStorage wins, and profiles.locale wins over both
			// because AuthContext applies it when the profile loads.
			if (!localeApplied) {
				localeApplied = true;
				if (!localStorage.getItem('neon-academy-locale')) applyLocale(loaded.defaultLocale);
			}

			if (alive) setSettings(loaded);
		});

		return () => {
			alive = false;
		};
	}, [applyLocale]);

	return settings;
}
