import { createClient } from 'npm:@supabase/supabase-js@2';
import { AwsClient } from 'npm:aws4fetch';

const allowedOrigins = [
	'https://neon-academy.sticklight.app',
	'https://academy.vibe-coding4elearning.com',
	'http://localhost:5173',
];

function getCorsHeaders(origin: string | null): Record<string, string> {
	const allowedOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
	return {
		'Access-Control-Allow-Origin': allowedOrigin,
		'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
		'Access-Control-Allow-Methods': 'POST, OPTIONS',
	};
}

interface FinalizeRequest {
	packageId: string;
	title: string;
	scormVersion: string;
	entryPoint: string;
	manifestJson: Record<string, unknown>;
	sizeBytes: number;
	moduleId?: string;
}

// Allowed SCORM versions per DB constraint
const ALLOWED_SCORM_VERSIONS = ['1.2', '2004_3rd', '2004_4th'];

// Allowed roles for SCORM upload
const ALLOWED_ROLES = ['super_admin', 'hr_manager', 'instructor'];

// Roles that can edit any module
const ADMIN_ROLES = ['super_admin', 'hr_manager'];

/**
 * Validate and sanitize a file path.
 * Returns null if the path is invalid.
 */
function sanitizePath(path: string): string | null {
	if (!path || path.length === 0) return null;
	// Reject NUL bytes
	if (path.includes('\0')) return null;
	// Reject path traversal
	if (path.includes('..')) return null;
	// Reject absolute paths
	if (path.startsWith('/')) return null;
	// Reject backslashes
	if (path.includes('\\')) return null;
	// Reject Windows drive letters (e.g., C:)
	if (/^[A-Za-z]:/.test(path)) return null;
	// Normalize separators to forward slash
	return path.replace(/\\/g, '/');
}

/**
 * Validate UUID format
 */
function isValidUUID(str: string): boolean {
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	return uuidRegex.test(str);
}

console.info('SCORM finalize function started [v2 cors-exact]');

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

		// Create Supabase clients
		const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
		const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
		const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

		// Client for auth verification (uses user's JWT)
		const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
			global: { headers: { Authorization: `Bearer ${jwt}` } },
		});

		// Service client for reads/writes (bypasses RLS)
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

		// Check if user is active
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

		// Check user role via user_roles table
		const { data: roleData, error: roleError } = await supabaseService
			.from('user_roles')
			.select('role')
			.eq('user_id', userId)
			.single();

		if (roleError || !roleData || !ALLOWED_ROLES.includes(roleData.role)) {
			return new Response(
				JSON.stringify({ error: 'Insufficient permissions' }),
				{ status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		const userRole = roleData.role;

		// Parse request body
		const body: FinalizeRequest = await req.json();
		const { packageId, title, scormVersion, entryPoint, manifestJson, sizeBytes, moduleId } = body;

		// Validate packageId is a valid UUID
		if (!packageId || !isValidUUID(packageId)) {
			return new Response(
				JSON.stringify({ error: 'Invalid packageId format' }),
				{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		// Validate SCORM version against allowed values
		if (!scormVersion || !ALLOWED_SCORM_VERSIONS.includes(scormVersion)) {
			return new Response(
				JSON.stringify({ error: `Invalid scormVersion. Must be one of: ${ALLOWED_SCORM_VERSIONS.join(', ')}` }),
				{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		// Validate and sanitize entryPoint
		const sanitizedEntryPoint = sanitizePath(entryPoint);
		if (!sanitizedEntryPoint) {
			return new Response(
				JSON.stringify({ error: 'Invalid entryPoint path' }),
				{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		// Validate title
		if (!title || typeof title !== 'string' || title.trim().length === 0) {
			return new Response(
				JSON.stringify({ error: 'Title is required' }),
				{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		// Get R2 credentials from env
		const R2_ACCOUNT_ID = Deno.env.get('R2_ACCOUNT_ID')!;
		const R2_ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID')!;
		const R2_SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY')!;
		const R2_BUCKET = Deno.env.get('R2_BUCKET')!;
		const R2_PUBLIC_BASE_URL = Deno.env.get('R2_PUBLIC_BASE_URL')!;

		// Create AWS client for HEAD request
		const awsClient = new AwsClient({
			accessKeyId: R2_ACCESS_KEY_ID,
			secretAccessKey: R2_SECRET_ACCESS_KEY,
		});

		const r2Endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

		// Verify the upload landed by checking the entry point file exists
		const entryKey = `packages/${packageId}/${sanitizedEntryPoint}`;
		const headUrl = `${r2Endpoint}/${R2_BUCKET}/${entryKey}`;

		try {
			const headRequest = await awsClient.sign(headUrl, { method: 'HEAD' });
			const headResponse = await fetch(headRequest);

			if (!headResponse.ok) {
				return new Response(
					JSON.stringify({ error: 'Uploaded package files not found' }),
					{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
				);
			}
		} catch (headErr) {
			console.error('HEAD request failed:', headErr);
			return new Response(
				JSON.stringify({ error: 'Uploaded package files not found' }),
				{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		// Build storage_base_url WITHOUT trailing slash
		const storageBaseUrl = `${R2_PUBLIC_BASE_URL}/packages/${packageId}`;

		// Insert scorm_packages row
		const { data: packageData, error: insertError } = await supabaseService
			.from('scorm_packages')
			.insert({
				id: packageId,
				title: title.trim(),
				scorm_version: scormVersion,
				storage_base_url: storageBaseUrl,
				entry_point: sanitizedEntryPoint,
				manifest_json: manifestJson,
				size_bytes: sizeBytes,
				uploaded_by: userId,
				is_public_sandbox: false,
			})
			.select()
			.single();

		if (insertError) {
			console.error('Package insert error:', insertError);
			return new Response(
				JSON.stringify({ error: 'Failed to create package record' }),
				{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		// If moduleId is provided, link the package to the module
		if (moduleId) {
			if (!isValidUUID(moduleId)) {
				return new Response(
					JSON.stringify({ error: 'Invalid moduleId format' }),
					{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
				);
			}

			// Get module and its course to check ownership
			const { data: moduleData, error: moduleError } = await supabaseService
				.from('modules')
				.select('id, course_id, courses!inner(created_by)')
				.eq('id', moduleId)
				.single();

			if (moduleError || !moduleData) {
				return new Response(
					JSON.stringify({ error: 'Module not found' }),
					{ status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
				);
			}

			// Check permission: caller must be course creator OR admin role
			const courseCreatedBy = (moduleData as unknown as { courses: { created_by: string } }).courses.created_by;
			const isOwner = courseCreatedBy === userId;
			const isAdmin = ADMIN_ROLES.includes(userRole);

			if (!isOwner && !isAdmin) {
				return new Response(
					JSON.stringify({ error: 'You do not have permission to edit this module' }),
					{ status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
				);
			}

			// Update the module
			const { error: updateError } = await supabaseService
				.from('modules')
				.update({
					scorm_package_id: packageId,
					module_type: 'scorm_package',
				})
				.eq('id', moduleId);

			if (updateError) {
				console.error('Module update error:', updateError);
				return new Response(
					JSON.stringify({ error: 'Failed to link package to module' }),
					{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
				);
			}
		}

		return new Response(
			JSON.stringify(packageData),
			{ status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	} catch (err) {
		console.error('SCORM finalize error:', err);
		return new Response(
			JSON.stringify({ error: 'Internal server error' }),
			{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	}
});
