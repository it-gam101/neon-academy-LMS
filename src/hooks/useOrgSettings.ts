import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { withTimeout } from '@/utils/fetchWithTimeout';
import { useLocale } from '@/hooks/useLocale';
import { isEmailAddress, isHttpsAddress } from '@/lib/contentSafety';

export interface OrgSettings {
	orgName: string | null;
	logoUrl: string | null;
	defaultLocale: 'en' | 'he';
	/** Item 115: the support contact (Admin → Organization); null when unset or not a valid shape — never linked. */
	supportEmail: string | null;
	supportUrl: string | null;
	/** Template B2: signed-out visitors see the public landing page and the public Sandbox demo; off = straight to sign-in. */
	publicLanding: boolean;
}

const FALLBACK: OrgSettings = { orgName: null, logoUrl: null, defaultLocale: 'en', supportEmail: null, supportUrl: null, publicLanding: false };

// Org branding is ONE row that changes almost never, read by several components. Cache it at
// module level so a page load costs a single request no matter how many of them mount.
//
// ⚠️ Deliberately a hook, NOT a provider: only the pages that need the row read it. Template B2:
// the Sandbox now reads it too (one public read), to know whether its public demo is switched on.
// It used to make ZERO backend calls (a Build B property), which a per-company switch cannot keep.
let cache: OrgSettings | null = null;
let inFlight: Promise<OrgSettings> | null = null;
let localeApplied = false;
// Every mounted useOrgSettings, so a save in Admin → Organization reaches the header, the landing page and the tab
// title at once instead of on the next reload.
const listeners = new Set<(next: OrgSettings) => void>();

// The browser tab shows the company's name (index.html holds one fixed title for every copy), unless the title
// already begins with it, as ours does: "Neon Academy | Corporate Learning Management".
function applyTitle(orgName: string | null) {
	if (orgName && document.title !== orgName && !document.title.startsWith(`${orgName} |`)) document.title = orgName;
}

/** Re-reads the row after Admin → Organization saves it and hands it to every mounted hook. */
export function reloadOrgSettings(): Promise<void> {
	const request = loadOrgSettings();
	inFlight = request;
	return request.then((loaded) => {
		if (inFlight === request) inFlight = null;
		// loadOrgSettings answers FALLBACK when the read fails: keep what is shown rather than blank the brand.
		if (loaded === FALLBACK && cache) return;
		cache = loaded;
		applyTitle(loaded.orgName);
		listeners.forEach((listener) => listener(loaded));
	});
}

async function loadOrgSettings(): Promise<OrgSettings> {
	if (!supabase) return FALLBACK;
	try {
		const { data, error } = await withTimeout(
			supabase.
			from('org_settings').
			select('org_name, logo_url, default_locale, support_email, support_url, public_landing').
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
			defaultLocale: data.default_locale === 'he' ? 'he' : 'en',
			supportEmail: data.support_email && isEmailAddress(data.support_email.trim()) ? data.support_email.trim() : null,
			supportUrl: data.support_url && isHttpsAddress(data.support_url.trim()) ? data.support_url.trim() : null,
			publicLanding: data.public_landing === true
		};
	} catch (err) {
		console.error('Failed to load org settings:', err);
		return FALLBACK;
	}
}

/** `ready` is false until the row has loaded (a failed read counts as loaded, with the fallback). */
export function useOrgSettings(): OrgSettings & { ready: boolean } {
	const { applyLocale } = useLocale();
	const [settings, setSettings] = useState<OrgSettings>(cache ?? FALLBACK);
	const [ready, setReady] = useState(cache !== null);

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

			applyTitle(loaded.orgName);

			if (alive) {
				setSettings(loaded);
				setReady(true);
			}
		});

		return () => {
			alive = false;
		};
	}, [applyLocale]);

	// A reload after Admin → Organization saves (reloadOrgSettings) reaches this hook too.
	useEffect(() => {
		const onReload = (next: OrgSettings) => {
			setSettings(next);
			setReady(true);
		};
		listeners.add(onReload);
		return () => {
			listeners.delete(onReload);
		};
	}, []);

	return { ...settings, ready };
}
