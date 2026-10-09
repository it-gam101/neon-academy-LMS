import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Supabase client instance.
 *
 * Returns null if Cloud Backend database is not enabled yet.
 * The database can be enabled via the chat by asking the AI to enable it.
 *
 * Usage:
 * ```typescript
 * import { supabase } from '@/integrations/supabase/client';
 *
 * if (!supabase) {
 *   // Database not enabled - handle gracefully
 *   return;
 * }
 *
 * const { data } = await supabase.from('todos').select('*');
 * ```
 */
/**
 * Dispatch 1c: EVERY request this client makes is bounded, so no screen can wait forever on a stalled connection
 * (QA J-05: the Media Library showed its loading skeleton for 80+ seconds). Data and sign-in calls get 20 s, Edge
 * Functions 120 s (processing a SCORM package can be slow). A caller's own abort still works. lib/errorText reads the
 * abort ("TimeoutError: TIMEOUT") as a timeout.
 */
const REQUEST_LIMIT_MS = 20000;
const FUNCTION_LIMIT_MS = 120000;

const boundedFetch: typeof fetch = (input, init) => {
	const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
	const controller = new AbortController();
	const limit = url.includes('/functions/v1/') ? FUNCTION_LIMIT_MS : REQUEST_LIMIT_MS;
	const timer = setTimeout(() => controller.abort(new DOMException('TIMEOUT', 'TimeoutError')), limit);
	const outer = init?.signal;
	if (outer) {
		if (outer.aborted) controller.abort(outer.reason);
		else outer.addEventListener('abort', () => controller.abort(outer.reason), { once: true });
	}
	return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
};

export const supabase: SupabaseClient<Database> | null = supabaseUrl && supabaseAnonKey ? createClient<Database>(supabaseUrl, supabaseAnonKey, { global: { fetch: boundedFetch } }) : null;
