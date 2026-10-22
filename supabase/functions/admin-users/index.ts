import { createClient } from 'npm:@supabase/supabase-js@2';
import { AwsClient } from 'npm:aws4fetch';

// Items 108 + 120, window 2 (2026-10-21): the two account actions that need the service role. super_admin only.
//   { action: 'delete', user_id, mode?: 'keep' | 'erase' } — delete an account. 'keep' (the default) keeps their
//     enrollments and module progress with an empty user (window 1's ON DELETE SET NULL); 'erase' deletes the
//     enrollments first. Either way their profile photo is removed from R2 and their name and e-mail are cleared from
//     the audit rows about them, so kept records cannot be traced back to the person.
//   { action: 'update_email', user_id, email } — change a login e-mail at once, with no confirmation link. Window 1's
//     trigger on auth.users then copies it to the profile and writes an 'email_changed' audit row.
// Neither action ever acts on a super_admin account, the caller's own included (Isaac, 2026-10-21): give them another
// role first. Every refusal and failure answers { error, code }: `error` says what happened, `code` lets the app show
// its own words for it.

// Template work B1: the web addresses allowed to call this function come from the ALLOWED_ORIGINS secret, a
// comma-separated list such as "https://academy.example.com,https://<project-id>.preview.sticklight.com", so each copy
// of the Academy sets its own with no code change. While the secret is missing, nothing is allowed.
const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
	.split(',')
	.map((o) => o.trim().replace(/\/+$/, '').toLowerCase())
	.filter((o) => o.length > 0);

if (allowedOrigins.length === 0) {
	console.error('ALLOWED_ORIGINS is not set: every browser call to this function will be refused. Add it in Secrets.');
}

// An origin that is not on the list gets NO Access-Control-Allow-Origin header, and the browser refuses the response.
function getCorsHeaders(origin: string | null): Record<string, string> {
	const headers: Record<string, string> = {
		'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
		'Access-Control-Allow-Methods': 'POST, OPTIONS',
		Vary: 'Origin',
	};
	if (origin && allowedOrigins.includes(origin.toLowerCase())) {
		headers['Access-Control-Allow-Origin'] = origin;
	}
	return headers;
}

interface AdminUsersRequest {
	action?: unknown;
	user_id?: unknown;
	mode?: unknown;
	email?: unknown;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The audit fields that name a person ('user_registered', 'email_changed', 'email_changed_by_admin'). They are cleared
// from the rows about a deleted user; the rows themselves stay.
const PERSONAL_META_KEYS = ['email', 'full_name', 'from', 'to'];

console.info('Admin users function started [v1 admin-users]');

Deno.serve(async (req: Request) => {
	const origin = req.headers.get('origin');
	const corsHeaders = getCorsHeaders(origin);
	const reply = (status: number, body: Record<string, unknown>) =>
		new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

	// Handle CORS preflight
	if (req.method === 'OPTIONS') {
		return new Response(null, { headers: corsHeaders });
	}

	if (req.method !== 'POST') {
		return reply(405, { error: 'Method not allowed', code: 'method_not_allowed' });
	}

	try {
		const authHeader = req.headers.get('Authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return reply(401, { error: 'Missing or invalid authorization header', code: 'unauthorized' });
		}

		const jwt = authHeader.replace('Bearer ', '');

		const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
		const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
		const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

		// Client for auth verification (uses the caller's JWT)
		const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
			global: { headers: { Authorization: `Bearer ${jwt}` } },
		});

		// Service client: bypasses RLS and holds the auth admin API, so every check below is enforced HERE, in code
		const supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
			auth: { persistSession: false, autoRefreshToken: false },
		});

		const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
		if (authError || !user) {
			return reply(401, { error: 'Invalid or expired token', code: 'unauthorized' });
		}

		const callerId = user.id;

		// The caller must be an ACTIVE super_admin. The role comes from user_roles (rule 1); is_active is checked here
		// because RLS does not check it, and a deactivated account's token stays valid until it expires (item 113).
		// A failed read is reported as a failure, never as "forbidden".
		const { data: callerRole, error: callerRoleError } = await supabaseService
			.from('user_roles')
			.select('role')
			.eq('user_id', callerId)
			.maybeSingle();

		if (callerRoleError) {
			console.error('Failed to read the caller\'s role:', callerRoleError);
			return reply(500, { error: `Could not check your role: ${callerRoleError.message}`, code: 'database_failed' });
		}

		if (callerRole?.role !== 'super_admin') {
			return reply(403, { error: 'Only a super admin can manage user accounts', code: 'forbidden' });
		}

		const { data: callerProfile, error: callerProfileError } = await supabaseService
			.from('profiles')
			.select('is_active')
			.eq('id', callerId)
			.maybeSingle();

		if (callerProfileError) {
			console.error('Failed to read the caller\'s profile:', callerProfileError);
			return reply(500, { error: `Could not check your account: ${callerProfileError.message}`, code: 'database_failed' });
		}

		if (callerProfile?.is_active !== true) {
			return reply(403, { error: 'Your account is deactivated', code: 'forbidden' });
		}

		// Validate the whole request before reading anything about the target
		let body: AdminUsersRequest;
		try {
			body = await req.json();
		} catch {
			return reply(400, { error: 'The request body must be JSON', code: 'bad_request' });
		}

		if (!body || typeof body !== 'object') {
			return reply(400, { error: 'The request body must be a JSON object', code: 'bad_request' });
		}

		const { action, user_id: targetId } = body;

		if (action !== 'delete' && action !== 'update_email') {
			return reply(400, { error: 'action must be "delete" or "update_email"', code: 'bad_request' });
		}

		if (typeof targetId !== 'string' || !UUID_RE.test(targetId)) {
			return reply(400, { error: 'Missing or invalid user_id', code: 'bad_request' });
		}

		// 'keep' is the default: a request that forgets the mode can never erase anything
		const mode = body.mode ?? 'keep';
		if (action === 'delete' && mode !== 'keep' && mode !== 'erase') {
			return reply(400, { error: 'mode must be "keep" or "erase"', code: 'bad_request' });
		}

		const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
		if (action === 'update_email' && (email.length > 254 || !EMAIL_RE.test(email))) {
			return reply(400, { error: 'Missing or invalid email', code: 'invalid_email' });
		}

		if (targetId === callerId) {
			return reply(403, { error: 'This action cannot be used on your own account', code: 'self' });
		}

		// The target must exist as a login (auth.users), not only as a profile
		const { data: targetData, error: targetError } = await supabaseService.auth.admin.getUserById(targetId);

		if (targetError) {
			if (targetError.status === 404) {
				return reply(404, { error: 'User not found', code: 'not_found' });
			}
			console.error('Failed to read the target account:', targetError);
			return reply(500, { error: `Could not read the account: ${targetError.message}`, code: 'auth_failed' });
		}

		if (!targetData.user) {
			return reply(404, { error: 'User not found', code: 'not_found' });
		}

		const targetEmail = targetData.user.email ?? null;

		const { data: targetRoleRow, error: targetRoleError } = await supabaseService
			.from('user_roles')
			.select('role')
			.eq('user_id', targetId)
			.maybeSingle();

		if (targetRoleError) {
			console.error('Failed to read the target\'s role:', targetRoleError);
			return reply(500, { error: `Could not read the user's role: ${targetRoleError.message}`, code: 'database_failed' });
		}

		const targetRole: string | null = targetRoleRow?.role ?? null;

		if (targetRole === 'super_admin') {
			return reply(403, { error: 'This is a super admin account. Give them another role first.', code: 'super_admin_target' });
		}

		// ════════════════════════════════════════════════════════════════
		// CHANGE A LOGIN E-MAIL
		// ════════════════════════════════════════════════════════════════
		if (action === 'update_email') {
			if (email === (targetEmail ?? '').toLowerCase()) {
				return reply(400, { error: 'That is already this user\'s e-mail', code: 'same_email' });
			}

			// At once and confirmed: no link is sent
			const { error: updateError } = await supabaseService.auth.admin.updateUserById(targetId, { email, email_confirm: true });

			if (updateError) {
				console.error('Failed to change the e-mail:', updateError);
				const inUse = updateError.code === 'email_exists' || /already been registered/i.test(updateError.message);
				return reply(inUse ? 409 : 500, {
					error: `Could not change the e-mail: ${updateError.message}`,
					code: inUse ? 'email_in_use' : 'auth_failed',
				});
			}

			// The login has changed. What follows can only add warnings; it never undoes the change.
			const warnings: string[] = [];

			// Window 1's trigger copies the new e-mail to the profile, but turns its own failure into a database
			// warning nobody sees, so read it back.
			const { data: profileRow, error: profileError } = await supabaseService
				.from('profiles')
				.select('email')
				.eq('id', targetId)
				.maybeSingle();

			if (profileError) {
				warnings.push(`Could not confirm that the profile shows the new e-mail: ${profileError.message}`);
			} else if (profileRow?.email !== email) {
				warnings.push('The login e-mail changed, but the profile does not show the new one');
			}

			// The trigger's 'email_changed' row names the user as its actor; this row names the admin who did it
			const { error: auditError } = await supabaseService.from('audit_log').insert({
				actor_id: callerId,
				action: 'email_changed_by_admin',
				entity: 'profiles',
				entity_id: targetId,
				meta: { from: targetEmail, to: email },
			});

			if (auditError) {
				warnings.push(`The e-mail changed, but its audit row could not be written: ${auditError.message}`);
			}

			for (const warning of warnings) console.error('update_email warning:', warning);

			return reply(200, { success: true, email, warnings });
		}

		// ════════════════════════════════════════════════════════════════
		// DELETE AN ACCOUNT
		// Everything that can still fail runs BEFORE the account is deleted, so a failure leaves the account in place
		// and the same request can simply be sent again. The deletion itself is the last irreversible step.
		// ════════════════════════════════════════════════════════════════

		// 1. Count their enrollments, for the audit row. A plain read, not a HEAD count: a HEAD answer has no body, so a
		//    failure would arrive with an empty message.
		const { data: enrollmentRows, error: countError } = await supabaseService
			.from('enrollments')
			.select('id')
			.eq('user_id', targetId);

		if (countError) {
			console.error('Failed to count enrollments:', countError);
			return reply(500, {
				error: `Could not count the user's enrollments: ${countError.message}. The account was not deleted.`,
				code: 'database_failed',
			});
		}

		const enrollmentCount = enrollmentRows?.length ?? 0;

		// 2. Their profile photo: every object under avatars/<id>/ (media-presign's key shape). The bucket is public, so
		//    a photo left behind would stay reachable at its address.
		const R2_ACCOUNT_ID = Deno.env.get('R2_ACCOUNT_ID');
		const R2_ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID');
		const R2_SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY');
		const R2_BUCKET = Deno.env.get('R2_BUCKET');

		if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
			console.error('R2 secrets are missing: the profile photo cannot be removed');
			return reply(500, {
				error: 'Storage is not configured (R2 secrets missing), so the profile photo cannot be removed. The account was not deleted.',
				code: 'storage_failed',
			});
		}

		const awsClient = new AwsClient({
			accessKeyId: R2_ACCESS_KEY_ID,
			secretAccessKey: R2_SECRET_ACCESS_KEY,
		});

		const r2Endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
		const avatarPrefix = `avatars/${targetId}/`;
		let avatarFilesDeleted = 0;

		try {
			let continuationToken: string | null = null;

			// List and delete all objects under the prefix, handling pagination
			do {
				let listUrl = `${r2Endpoint}/${R2_BUCKET}?list-type=2&prefix=${encodeURIComponent(avatarPrefix)}`;
				if (continuationToken) {
					listUrl += `&continuation-token=${encodeURIComponent(continuationToken)}`;
				}

				const listResponse = await fetch(await awsClient.sign(listUrl, { method: 'GET' }));

				if (!listResponse.ok) {
					console.error('R2 list failed:', listResponse.status, listResponse.statusText);
					return reply(500, {
						error: `Could not list the profile photo in storage (${listResponse.status}). The account was not deleted.`,
						code: 'storage_failed',
					});
				}

				const listXml = await listResponse.text();

				for (const match of listXml.matchAll(/<Key>([^<]+)<\/Key>/g)) {
					const key = match[1];
					if (!key.startsWith(avatarPrefix)) continue;

					const deleteResponse = await fetch(await awsClient.sign(`${r2Endpoint}/${R2_BUCKET}/${key}`, { method: 'DELETE' }));

					// 404 is fine — object already gone. Any other non-2xx aborts.
					if (!deleteResponse.ok && deleteResponse.status !== 404) {
						console.error('R2 delete failed for key:', key, deleteResponse.status, deleteResponse.statusText);
						return reply(500, {
							error: `Could not delete the profile photo from storage (${deleteResponse.status}). The account was not deleted.`,
							code: 'storage_failed',
						});
					}

					avatarFilesDeleted++;
				}

				const tokenMatch = listXml.match(/<NextContinuationToken>([^<]+)<\/NextContinuationToken>/);
				continuationToken = tokenMatch ? tokenMatch[1] : null;
			} while (continuationToken);
		} catch (r2Err) {
			console.error('R2 error:', r2Err);
			return reply(500, {
				error: `Could not remove the profile photo from storage: ${r2Err instanceof Error ? r2Err.message : String(r2Err)}. The account was not deleted.`,
				code: 'storage_failed',
			});
		}

		// 3. Clear the name and e-mail from the audit rows about them. The rows stay; only the fields that name the
		//    person go. Each update must come back with its row (rule 4b).
		const { data: auditRows, error: auditReadError } = await supabaseService
			.from('audit_log')
			.select('id, meta')
			.eq('entity', 'profiles')
			.eq('entity_id', targetId);

		if (auditReadError) {
			console.error('Failed to read the audit rows:', auditReadError);
			return reply(500, {
				error: `Could not read the audit rows about this user: ${auditReadError.message}. The account was not deleted.`,
				code: 'database_failed',
			});
		}

		let auditRowsCleared = 0;

		for (const row of auditRows ?? []) {
			const meta = row.meta;
			if (!meta || typeof meta !== 'object' || Array.isArray(meta)) continue;
			if (!PERSONAL_META_KEYS.some((k) => k in meta)) continue;

			const cleaned = Object.fromEntries(Object.entries(meta).filter(([k]) => !PERSONAL_META_KEYS.includes(k)));

			const { data: updated, error: clearError } = await supabaseService
				.from('audit_log')
				.update({ meta: cleaned })
				.eq('id', row.id)
				.select('id');

			if (clearError || !updated || updated.length === 0) {
				console.error('Failed to clear audit row:', row.id, clearError);
				return reply(500, {
					error: `Could not clear the name and e-mail from an audit row: ${clearError?.message ?? 'no row updated'}. The account was not deleted.`,
					code: 'database_failed',
				});
			}

			auditRowsCleared++;
		}

		// 4. 'erase' only: delete their enrollments first (module progress and SCORM data go with them by cascade).
		//    'keep' leaves them: the deletion below empties their user_id (window 1).
		let enrollmentsErased = 0;

		if (mode === 'erase') {
			const { data: erased, error: eraseError } = await supabaseService
				.from('enrollments')
				.delete()
				.eq('user_id', targetId)
				.select('id');

			if (eraseError) {
				console.error('Failed to erase enrollments:', eraseError);
				return reply(500, {
					error: `Could not erase the enrollments: ${eraseError.message}. The account was not deleted.`,
					code: 'database_failed',
				});
			}

			enrollmentsErased = erased?.length ?? 0;
		}

		// 5. Delete the login. auth.users cascades to the profile, user_roles, quiz attempts, SCORM data and saved reports.
		const { error: deleteError } = await supabaseService.auth.admin.deleteUser(targetId);

		if (deleteError) {
			console.error('Failed to delete the account:', deleteError);
			const erasedNote = enrollmentsErased > 0
				? ` Their ${enrollmentsErased} enrollment(s) were already erased; send the same request again to finish.`
				: '';
			return reply(500, { error: `Could not delete the account: ${deleteError.message}${erasedNote}`, code: 'auth_failed' });
		}

		// 6. The audit row naming who did it — written after the deletion, so it never records one that did not happen
		const warnings: string[] = [];
		const enrollmentsKept = mode === 'keep' ? enrollmentCount : 0;

		const { error: auditError } = await supabaseService.from('audit_log').insert({
			actor_id: callerId,
			action: 'user_deleted',
			entity: 'profiles',
			entity_id: targetId,
			meta: mode === 'erase'
				? { mode, role: targetRole, enrollments_erased: enrollmentsErased }
				: { mode, role: targetRole, enrollments_kept: enrollmentsKept },
		});

		if (auditError) {
			console.error('Failed to write the user_deleted audit row:', auditError);
			warnings.push(`The account was deleted, but its audit row could not be written: ${auditError.message}`);
		}

		return reply(200, {
			success: true,
			mode,
			enrollments_kept: enrollmentsKept,
			enrollments_erased: enrollmentsErased,
			avatar_files_deleted: avatarFilesDeleted,
			audit_rows_cleared: auditRowsCleared,
			warnings,
		});
	} catch (err) {
		console.error('Admin users error:', err);
		return reply(500, {
			error: `Internal server error: ${err instanceof Error ? err.message : String(err)}`,
			code: 'server_error',
		});
	}
});
