/**
 * Dispatch 1a — "errors say what happened" (2026-10-08): one place that turns any failure into words the reader can
 * act on, in the reader's language.
 *
 * Rule 4 (CLAUDE.md): Supabase's PostgrestError is NOT `instanceof Error`, so never gate on it — `errorMessage` reads
 * `.message` from anything. `describeError` says what KIND of failure it was, and keeps the original message as
 * `detail`, so whatever breaks still tells us what broke.
 */
import { dictionaries, type Dictionary, type Locale } from '@/i18n/dictionary';

export type ErrorKind =
	| 'timeout'
	| 'network'
	| 'session'
	| 'refused'
	| 'notFound'
	| 'credentials'
	| 'unconfirmed'
	| 'registered'
	| 'rateLimit'
	| 'samePassword'
	| 'other';

/** The message of anything thrown or returned — a string, an Error, a PostgrestError, an AuthError — else `fallback`. */
export function errorMessage(err: unknown, fallback: string): string {
	if (typeof err === 'string') return err.trim() || fallback;
	const message = (err as { message?: unknown } | null | undefined)?.message;
	return typeof message === 'string' && message.trim() ? message.trim() : fallback;
}

// Matched against the message, in this order: Supabase's own wording (PostgREST, Auth, functions-js) and the app's own
// markers ('TIMEOUT' from withTimeout, 'Not authenticated' from the hooks).
const KINDS: [Exclude<ErrorKind, 'other'>, RegExp][] = [
	['timeout', /^TIMEOUT$|timed out/i],
	['network', /failed to fetch|networkerror|network request failed|load failed|failed to send a request/i],
	['session', /jwt expired|invalid jwt|invalid or expired token|auth session missing|not authenticated/i],
	['refused', /row-level security|permission denied/i],
	['notFound', /json object requested|cannot coerce the result to a single json object/i],
	['credentials', /invalid login credentials/i],
	['unconfirmed', /email not confirmed/i],
	['registered', /already registered|already been registered/i],
	['rateLimit', /rate limit|too many requests|for security purposes/i],
	['samePassword', /should be different from the old password/i],
];

/** What went wrong, in the reader's language (`text`), and the original message when it adds something (`detail`). */
export function describeError(err: unknown, dict: Dictionary, locale: Locale): { kind: ErrorKind; text: string; detail: string | null } {
	const raw = errorMessage(err, '');
	// A page that already says "not found" in its own words — in either language, in case the reader switched since —
	// gets the full sentence, with nothing below it.
	if (Object.values(dictionaries).some((d) => raw === d.common.notFound || raw === d.errors.noAccess)) {
		return { kind: 'notFound', text: dict.errors.notFound, detail: null };
	}

	const code = (err as { code?: unknown } | null | undefined)?.code;
	let kind: ErrorKind = code === '42501' ? 'refused' : code === 'PGRST116' ? 'notFound' : 'other';
	if (kind === 'other') kind = KINDS.find(([, pattern]) => pattern.test(raw))?.[0] ?? 'other';

	if (kind !== 'other') {
		const words: Record<Exclude<ErrorKind, 'other'>, string> = {
			timeout: dict.errors.connectionTimeout,
			network: dict.errors.network,
			session: dict.errors.sessionExpired,
			refused: dict.common.changeRefused,
			notFound: dict.errors.notFound,
			credentials: dict.errors.invalidCredentials,
			unconfirmed: dict.errors.emailNotConfirmed,
			registered: dict.errors.alreadyRegistered,
			rateLimit: dict.errors.tooManyAttempts,
			samePassword: dict.errors.samePassword,
		};
		const text = words[kind];
		// A timeout or a lost connection is said in full by the sentence; anything else keeps its original message.
		const detail = kind === 'timeout' || kind === 'network' || !raw || raw === text ? null : raw;
		return { kind, text, detail };
	}
	if (!raw) return { kind, text: dict.common.error, detail: null };
	// Text already written for this reader — anything on an English page, Hebrew on a Hebrew page — is shown as it is.
	// A raw English message on a Hebrew page gets a Hebrew sentence, with the original kept below it.
	if (locale === 'en' || /[֐-׿]/.test(raw)) return { kind, text: raw, detail: null };
	return { kind, text: dict.common.error, detail: raw };
}
