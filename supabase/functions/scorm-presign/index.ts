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

interface PresignRequest {
	files: Array<{ path: string; size: number }>;
	totalSize: number;
}

const MAX_FILES = 300;
const MAX_TOTAL_SIZE = 150 * 1024 * 1024; // 150 MB
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const PRESIGN_EXPIRY = 600; // seconds

// Allowed roles for SCORM upload
const ALLOWED_ROLES = ['super_admin', 'hr_manager', 'instructor'];

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
	// Normalize separators to forward slash (already done, but ensure)
	return path.replace(/\\/g, '/');
}

console.info('SCORM presign function started [v2 cors-exact]');

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

		// Service client for reads (bypasses RLS)
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

		// Parse request body
		const body: PresignRequest = await req.json();
		const { files, totalSize } = body;

		// Validate files array
		if (!Array.isArray(files) || files.length === 0) {
			return new Response(
				JSON.stringify({ error: 'Files array is required and must not be empty' }),
				{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		if (files.length > MAX_FILES) {
			return new Response(
				JSON.stringify({ error: `Maximum ${MAX_FILES} files allowed` }),
				{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		if (totalSize > MAX_TOTAL_SIZE) {
			return new Response(
				JSON.stringify({ error: `Total size exceeds ${MAX_TOTAL_SIZE / 1024 / 1024} MB limit` }),
				{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		// Validate and sanitize each file path
		const seenPaths = new Set<string>();
		const sanitizedFiles: Array<{ path: string; size: number }> = [];

		for (const file of files) {
			if (file.size > MAX_FILE_SIZE) {
				return new Response(
					JSON.stringify({ error: `File exceeds ${MAX_FILE_SIZE / 1024 / 1024} MB limit: ${file.path}` }),
					{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
				);
			}

			const sanitizedPath = sanitizePath(file.path);
			if (!sanitizedPath) {
				return new Response(
					JSON.stringify({ error: `Invalid file path: ${file.path}` }),
					{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
				);
			}

			// Check for duplicates
			const normalizedPath = sanitizedPath.toLowerCase();
			if (seenPaths.has(normalizedPath)) {
				return new Response(
					JSON.stringify({ error: `Duplicate file path: ${file.path}` }),
					{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
				);
			}
			seenPaths.add(normalizedPath);
			sanitizedFiles.push({ path: sanitizedPath, size: file.size });
		}

		// Generate package ID and prefix
		const packageId = crypto.randomUUID();
		const prefix = `packages/${packageId}/`;

		// Get R2 credentials from env
		const R2_ACCOUNT_ID = Deno.env.get('R2_ACCOUNT_ID')!;
		const R2_ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID')!;
		const R2_SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY')!;
		const R2_BUCKET = Deno.env.get('R2_BUCKET')!;

		// Create AWS client for presigning
		const awsClient = new AwsClient({
			accessKeyId: R2_ACCESS_KEY_ID,
			secretAccessKey: R2_SECRET_ACCESS_KEY,
		});

		const r2Endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

		// Generate presigned URLs for each file
		const uploads: Array<{ path: string; url: string }> = [];

		for (const file of sanitizedFiles) {
			const key = `${prefix}${file.path}`;

			// X-Amz-Expires MUST be a QUERY parameter, not a header. aws4fetch reads the
			// expiry from the URL search params; passing it as a header both (a) leaves the
			// expiry at the 86400s default and (b) adds x-amz-expires to X-Amz-SignedHeaders,
			// which makes R2 reject the browser's PUT with a signature mismatch.
			const url = new URL(`${r2Endpoint}/${R2_BUCKET}/${key}`);
			url.searchParams.set('X-Amz-Expires', String(PRESIGN_EXPIRY));

			const signed = await awsClient.sign(url.toString(), {
				method: 'PUT',
				aws: { signQuery: true },
			});

			uploads.push({ path: file.path, url: signed.url });
		}

		return new Response(
			JSON.stringify({ packageId, prefix, uploads }),
			{ status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	} catch (err) {
		console.error('SCORM presign error:', err);
		return new Response(
			JSON.stringify({ error: 'Internal server error' }),
			{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	}
});
