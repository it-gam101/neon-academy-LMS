import { supabase } from '@/integrations/supabase/client';
import { ensureSession } from '@/lib/ensureSession';
import { errorMessage } from '@/lib/errorText';
import type { Dictionary } from '@/i18n/dictionary';

// Items 108 + 120, window 4: the Admin page's calls to the admin-users Edge Function (window 2). Every refusal or
// failure comes back as { error, code }: the code picks the reader's own words, a failure also keeps the server's
// message (it says what broke), and the whole answer goes to the console (CLAUDE.md rule 4).
// The caller bounds the call with withTimeout, next to its busy flag; that bound covers ensureSession too.

export interface DeleteUserResult {
	success: true;
	mode: 'keep' | 'erase';
	enrollments_kept: number;
	enrollments_erased: number;
	avatar_files_deleted: number;
	audit_rows_cleared: number;
	warnings: string[];
}

export interface UpdateEmailResult {
	success: true;
	email: string;
	warnings: string[];
}

// A refusal is fully said by its own words; a failure also carries what the server said broke.
const FAILURE_CODES = ['bad_request', 'storage_failed', 'database_failed', 'auth_failed', 'server_error'];

export async function callAdminUsers<T>(
	body: Record<string, unknown>,
	dict: Dictionary
): Promise<{ ok: true; data: T } | { ok: false; message: string }> {
	if (!supabase) return { ok: false, message: dict.common.error };
	// Item 104: with no live session supabase-js would send the anon key, and the function would only say "invalid token".
	if (!(await ensureSession())) return { ok: false, message: dict.errors.sessionExpired };

	try {
		const { data, error } = await supabase.functions.invoke('admin-users', { body });

		if (error) {
			// FunctionsHttpError carries the Response on `context`
			const ctx = (error as { context?: Response }).context;
			let answer: { error?: string; code?: string } | null = null;
			if (ctx && typeof ctx.json === 'function') {
				try {
					answer = await ctx.json();
				} catch {
					answer = null;
				}
			}
			console.error('admin-users failed:', error, answer);
			const server = answer?.error || errorMessage(error, dict.common.error);
			const words = answer?.code ? (dict.admin.userActionErrors as Record<string, string | undefined>)[answer.code] : undefined;
			if (!words) return { ok: false, message: server };
			return { ok: false, message: answer?.code && FAILURE_CODES.includes(answer.code) ? `${words} ${server}` : words };
		}

		return { ok: true, data: data as T };
	} catch (err) {
		console.error('admin-users threw:', err);
		return { ok: false, message: errorMessage(err, dict.common.error) };
	}
}
