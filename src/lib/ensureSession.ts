import { supabase } from '@/integrations/supabase/client';
import { withTimeout } from '@/utils/fetchWithTimeout';

/**
 * Returns a live access token, or null when the user is effectively signed out.
 *
 * ⚠️ Why this exists — BACKLOG item 104. supabase-js falls back to the ANON KEY when
 * `getSession()` yields no session, and it discards the error while doing so
 * (`SupabaseClient.js:164-171`):
 *
 *     const { data } = await this.auth.getSession();
 *     return data.session?.access_token ?? this.supabaseKey;
 *
 * The request then goes out UNAUTHENTICATED. An Edge Function validates it server-side
 * and answers "Invalid or expired token", which reads like a token problem when the
 * session is actually gone entirely. Call this first so the user is told the truth.
 */
export async function ensureSession(): Promise<string | null> {
	if (!supabase) return null;

	const { data } = await supabase.auth.getSession();
	if (data.session?.access_token) return data.session.access_token;

	// No session. One explicit refresh recovers the common multi-tab case, where another
	// tab has already written a good session to storage. If the refresh token is genuinely
	// used up this fails too — and then the user really is signed out.
	try {
		const { data: refreshed, error } = await withTimeout(supabase.auth.refreshSession(), 10000);
		if (error || !refreshed?.session?.access_token) {
			console.error('Session refresh failed — treating the user as signed out:', error);
			return null;
		}
		return refreshed.session.access_token;
	} catch (err) {
		console.error('Session refresh threw — treating the user as signed out:', err);
		return null;
	}
}
