import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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

// Extract CMI fields based on SCORM version
function extractCmiFields(cmi: Record<string, unknown>, scormVersion: string): CmiExtracted {
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
			score_raw: scoreObj.raw != null ? Number(scoreObj.raw) : null,
			total_time: (core.total_time as string) || null,
			suspend_data: (cmi.suspend_data as string) || null,
		};
	} else {
		// SCORM 2004 has separate completion_status and success_status
		const scoreObj = (cmi.score as Record<string, unknown>) || {};

		return {
			completion_status: (cmi.completion_status as string) || null,
			success_status: (cmi.success_status as string) || null,
			score_raw: scoreObj.raw != null ? Number(scoreObj.raw) : null,
			total_time: (cmi.total_time as string) || null,
			suspend_data: (cmi.suspend_data as string) || null,
		};
	}
}

console.info('SCORM commit function started');

Deno.serve(async (req: Request) => {
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

		// Get SCORM version for CMI extraction
		const { data: packageData } = await supabaseService
			.from('scorm_packages')
			.select('scorm_version')
			.eq('id', package_id)
			.single();

		const scormVersion = packageData?.scorm_version || '1.2';

		// Extract CMI fields
		const extracted = extractCmiFields(cmi, scormVersion);

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
					updated_at: new Date().toISOString(),
				},
				{
					onConflict: 'enrollment_id,module_id',
				}
			);

		if (progressError) {
			console.error('Module progress upsert error:', progressError);
		}

		// Check if all modules are completed and update enrollment
		let enrollmentStatus = enrollment.status;

		if (isCompleted) {
			// Get all modules for the course
			const { data: allModules } = await supabaseService
				.from('modules')
				.select('id')
				.eq('course_id', enrollment.course_id);

			// Get progress for all modules
			const { data: allProgress } = await supabaseService
				.from('module_progress')
				.select('module_id, status, score')
				.eq('enrollment_id', enrollment_id);

			const progressMap = new Map((allProgress || []).map((p) => [p.module_id, p]));
			const allCompleted = (allModules || []).every((m) => {
				const prog = progressMap.get(m.id);
				return prog?.status === 'completed';
			});

			if (allCompleted) {
				// Calculate average score
				const scores = (allProgress || [])
					.filter((p) => p.score != null)
					.map((p) => p.score as number);

				const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

				await supabaseService
					.from('enrollments')
					.update({
						status: 'completed',
						completed_at: new Date().toISOString(),
						score: avgScore,
					})
					.eq('id', enrollment_id);

				enrollmentStatus = 'completed';
			}
		} else if (enrollment.status === 'not_started') {
			await supabaseService
				.from('enrollments')
				.update({ status: 'in_progress' })
				.eq('id', enrollment_id);

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
