import { createClient } from 'npm:@supabase/supabase-js@2';

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

interface ScormCommitRequest {
	module_id: string;
	package_id: string;
	enrollment_id: string;
	event: 'commit' | 'terminate';
	cmi: Record<string, unknown>;
}

interface CmiExtracted {
	completion_status: string | null;
	success_status: string | null;
	score_raw: number | null;
	total_time: string | null;
	suspend_data: string | null;
}

// scorm-again's renderCMIToJSONObject() wraps its output as { cmi: {...} }, and the
// bridge posts that under its own `cmi` key, so payloads arrive as { cmi: { cmi: {...} } }.
// Unwrap defensively and tolerate the already-unwrapped shape too, so a future bridge
// change cannot silently re-break completion.
function unwrapCmi(cmi: Record<string, unknown>): Record<string, unknown> {
	const inner = cmi?.cmi;
	if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
		return inner as Record<string, unknown>;
	}
	return cmi ?? {};
}

// Normalise score to 0–100 percentage, handling min/max and out-of-range values
function normaliseScore(scoreObj: Record<string, unknown>): number | null {
	const rawN = scoreObj.raw != null ? Number(scoreObj.raw) : NaN;
	if (!Number.isFinite(rawN)) return null;

	const minN = scoreObj.min != null && Number.isFinite(Number(scoreObj.min)) ? Number(scoreObj.min) : 0;
	const maxN = scoreObj.max != null && Number.isFinite(Number(scoreObj.max)) ? Number(scoreObj.max) : 100;

	// Unusable scale — treat raw as an already-computed percentage, clamped.
	if (maxN <= minN) {
		console.error('[scorm-commit] unusable score scale, clamping raw as percentage:', JSON.stringify(scoreObj));
		return Math.min(100, Math.max(0, rawN));
	}

	if (rawN > maxN || rawN < minN) {
		console.error('[scorm-commit] score out of declared range — bad publisher:', JSON.stringify(scoreObj));
	}

	const pct = ((rawN - minN) / (maxN - minN)) * 100;
	return Math.round(Math.min(100, Math.max(0, pct)) * 100) / 100;
}

// Extract CMI fields based on SCORM version
function extractCmiFields(rawCmi: Record<string, unknown>, scormVersion: string): CmiExtracted {
	const cmi = unwrapCmi(rawCmi);
	if (scormVersion === '1.2') {
		// SCORM 1.2 uses cmi.core.lesson_status for both completion and success
		const core = (cmi.core as Record<string, unknown>) || {};
		const lessonStatus = (core.lesson_status as string) || '';
		const scoreObj = (core.score as Record<string, unknown>) || {};

		let completionStatus: string | null = null;
		let successStatus: string | null = null;

		// Map lesson_status to completion/success
		switch (lessonStatus.toLowerCase()) {
			case 'passed':
				completionStatus = 'completed';
				successStatus = 'passed';
				break;
			case 'completed':
				completionStatus = 'completed';
				break;
			case 'failed':
				completionStatus = 'completed';
				successStatus = 'failed';
				break;
			case 'incomplete':
				completionStatus = 'incomplete';
				break;
			case 'browsed':
				completionStatus = 'incomplete';
				break;
			case 'not attempted':
				completionStatus = 'not attempted';
				break;
			default:
				completionStatus = 'incomplete';
		}

		return {
			completion_status: completionStatus,
			success_status: successStatus,
			score_raw: normaliseScore(scoreObj),
			total_time: (core.total_time as string) || null,
			suspend_data: (cmi.suspend_data as string) || null,
		};
	} else {
		// SCORM 2004 has separate completion_status and success_status
		const scoreObj = (cmi.score as Record<string, unknown>) || {};

		return {
			completion_status: (cmi.completion_status as string) || null,
			success_status: (cmi.success_status as string) || null,
			score_raw: normaliseScore(scoreObj),
			total_time: (cmi.total_time as string) || null,
			suspend_data: (cmi.suspend_data as string) || null,
		};
	}
}

console.info('SCORM commit function started [v3 origins-secret]');

Deno.serve(async (req: Request) => {
	const origin = req.headers.get('origin');
	const corsHeaders = getCorsHeaders(origin);

	// Handle CORS preflight
	if (req.method === 'OPTIONS') {
		return new Response(null, { headers: corsHeaders });
	}

	if (req.method !== 'POST') {
		return new Response(
			JSON.stringify({ error: 'Method not allowed' }),
			{ status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	}

	try {
		// Authenticate caller from JWT
		const authHeader = req.headers.get('Authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return new Response(
				JSON.stringify({ error: 'Missing or invalid authorization header' }),
				{ status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		const jwt = authHeader.replace('Bearer ', '');

		// Create Supabase client with user's JWT for auth check
		const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
		const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
		const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

		// Client for auth verification (uses user's JWT)
		const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
			global: { headers: { Authorization: `Bearer ${jwt}` } },
		});

		// Service client for writes (bypasses RLS)
		const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

		// Get user from JWT
		const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
		if (authError || !user) {
			return new Response(
				JSON.stringify({ error: 'Invalid or expired token' }),
				{ status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		const userId = user.id;

		// Server-side backstop: check if user is deactivated
		// Note: Full RLS-level enforcement is deferred; this is an explicit check
		const { data: profileData, error: profileError } = await supabaseService
			.from('profiles')
			.select('is_active')
			.eq('id', userId)
			.single();

		if (profileError || !profileData || !profileData.is_active) {
			return new Response(
				JSON.stringify({ error: 'Account is deactivated' }),
				{ status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		// Parse request body
		const body: ScormCommitRequest = await req.json();
		const { module_id, package_id, enrollment_id, event, cmi } = body;

		if (!module_id || !package_id || !enrollment_id || !event || !cmi) {
			return new Response(
				JSON.stringify({ error: 'Missing required fields' }),
				{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		// Validate: enrollment belongs to user
		const { data: enrollment, error: enrollmentError } = await supabaseService
			.from('enrollments')
			.select('id, course_id, user_id, status')
			.eq('id', enrollment_id)
			.single();

		if (enrollmentError || !enrollment || enrollment.user_id !== userId) {
			return new Response(
				JSON.stringify({ error: 'Enrollment not found or access denied' }),
				{ status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		// Validate: module belongs to enrollment's course and references the package
		const { data: moduleData, error: moduleError } = await supabaseService
			.from('modules')
			.select('id, course_id, scorm_package_id')
			.eq('id', module_id)
			.single();

		if (
			moduleError ||
			!moduleData ||
			moduleData.course_id !== enrollment.course_id ||
			moduleData.scorm_package_id !== package_id
		) {
			return new Response(
				JSON.stringify({ error: 'Module validation failed' }),
				{ status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		// Get SCORM version for CMI extraction.
		// B1: a failed read must not fall back to 1.2. A 2004 package read as 1.2 has no lesson_status, so the lesson
		// would be saved as "incomplete", overwriting a completion. Refuse instead: the player offers Retry.
		const { data: packageData, error: packageError } = await supabaseService
			.from('scorm_packages')
			.select('scorm_version')
			.eq('id', package_id)
			.single();

		if (packageError || !packageData) {
			console.error('SCORM package read error:', packageError);
			return new Response(
				JSON.stringify({ error: 'Failed to read SCORM package' }),
				{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		const scormVersion = packageData.scorm_version || '1.2';

		// Extract CMI fields
		const extracted = extractCmiFields(cmi, scormVersion);

		// SCORM 2004 splits completion from success; 1.2 collapses both onto
		// lesson_status, which extractCmiFields already maps into success_status.
		// null means the package did not say — that is NOT a failure.
		const passed =
			extracted.success_status === 'passed' ? true :
			extracted.success_status === 'failed' ? false :
			null;

		// Upsert scorm_registrations
		const { data: registration, error: upsertError } = await supabaseService
			.from('scorm_registrations')
			.upsert(
				{
					user_id: userId,
					package_id,
					enrollment_id,
					module_id,
					cmi_data: cmi,
					completion_status: extracted.completion_status,
					success_status: extracted.success_status,
					score_raw: extracted.score_raw,
					total_time: extracted.total_time,
					suspend_data: extracted.suspend_data,
					updated_at: new Date().toISOString(),
				},
				{
					onConflict: 'user_id,package_id,enrollment_id',
				}
			)
			.select()
			.single();

		if (upsertError) {
			console.error('Registration upsert error:', upsertError);
			return new Response(
				JSON.stringify({ error: 'Failed to save SCORM data' }),
				{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		// Determine module status and update module_progress
		const isCompleted = extracted.completion_status === 'completed';
		const moduleStatus = isCompleted ? 'completed' : 'in_progress';

		// Upsert module_progress
		const { error: progressError } = await supabaseService
			.from('module_progress')
			.upsert(
				{
					enrollment_id,
					module_id,
					status: moduleStatus,
					score: extracted.score_raw,
					// Only written when the package actually said. Omitting the key on an
					// intermediate commit PRESERVES a pass/fail already recorded; sending
					// null would wipe it on every progress ping.
					...(passed !== null && { passed }),
					updated_at: new Date().toISOString(),
				},
				{
					onConflict: 'enrollment_id,module_id',
				}
			);

		if (progressError) {
			// B1: the lesson's progress was NOT saved. Say so, and the player offers Retry (a retry repeats these same
			// upserts, which is safe). Answering 200 here left a finished lesson unfinished, with no sign of it.
			console.error('Module progress upsert error:', progressError);
			return new Response(
				JSON.stringify({ error: 'Failed to save lesson progress' }),
				{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		// Check if all modules are completed and update enrollment
		let enrollmentStatus = enrollment.status;

		// B1: every read and write below is checked. A failure answers 500 and the player offers Retry, which repeats
		// the same writes (safe). Before, a failed read of the course's modules gave an EMPTY list — every() of an empty
		// list is true, so the course was marked completed — and a failed write answered 200 with a status never saved.
		const rollupFailed = (step: string, err: unknown) => {
			console.error(`Enrollment rollup error (${step}):`, err);
			return new Response(
				JSON.stringify({ error: 'Failed to update course progress' }),
				{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		};

		if (isCompleted) {
			// Get all modules for the course
			const { data: allModules, error: modulesError } = await supabaseService
				.from('modules')
				.select('id')
				.eq('course_id', enrollment.course_id);

			if (modulesError || !allModules) return rollupFailed('read modules', modulesError);

			// Get progress for all modules
			const { data: allProgress, error: allProgressError } = await supabaseService
				.from('module_progress')
				.select('module_id, status, score, passed')
				.eq('enrollment_id', enrollment_id);

			if (allProgressError || !allProgress) return rollupFailed('read module_progress', allProgressError);

			const progressMap = new Map((allProgress || []).map((p) => [p.module_id, p]));
			const allCompleted = (allModules || []).every((m) => {
				const prog = progressMap.get(m.id);
				// `!== false` and NEVER `=== true`: null means not-applicable (a lesson)
				// or unknown (a legacy row), and must keep counting exactly as it does
				// today. `=== true` would stop every lesson-only course completing.
				return prog?.status === 'completed' && prog?.passed !== false;
			});

			if (allCompleted) {
				// Calculate average score
				const scores = (allProgress || [])
					.filter((p) => p.score != null)
					.map((p) => p.score as number);

				const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

				const { data: completedRows, error: completeError } = await supabaseService
					.from('enrollments')
					.update({
						status: 'completed',
						completed_at: new Date().toISOString(),
						score: avgScore,
					})
					.eq('id', enrollment_id)
					.select('id');

				if (completeError || !completedRows?.length) return rollupFailed('complete', completeError ?? 'no row updated');

				enrollmentStatus = 'completed';
			} else if (enrollment.status === 'completed') {
				// The course had already rolled up and a failure has now arrived.
				// Leaving it "completed" is exactly the misrepresentation this change
				// exists to end, so demote it and clear the completion average, which
				// was computed including the failed module.
				const { data: demotedRows, error: demoteError } = await supabaseService
					.from('enrollments')
					.update({ status: 'in_progress', completed_at: null, score: null })
					.eq('id', enrollment_id)
					.select('id');

				if (demoteError || !demotedRows?.length) return rollupFailed('demote', demoteError ?? 'no row updated');

				enrollmentStatus = 'in_progress';
			}
		} else if (enrollment.status === 'not_started') {
			const { data: startedRows, error: startError } = await supabaseService
				.from('enrollments')
				.update({ status: 'in_progress' })
				.eq('id', enrollment_id)
				.select('id');

			if (startError || !startedRows?.length) return rollupFailed('start', startError ?? 'no row updated');

			enrollmentStatus = 'in_progress';
		}

		return new Response(
			JSON.stringify({
				registration: {
					id: registration.id,
					completion_status: extracted.completion_status,
					success_status: extracted.success_status,
					score_raw: extracted.score_raw,
					total_time: extracted.total_time,
				},
				module_status: moduleStatus,
				module_passed: passed,
				enrollment_status: enrollmentStatus,
			}),
			{ status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	} catch (error) {
		console.error('SCORM commit error:', error);
		return new Response(
			JSON.stringify({ error: 'Internal server error' }),
			{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	}
});
