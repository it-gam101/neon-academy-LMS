import { createClient } from 'npm:@supabase/supabase-js@2';
import { AwsClient } from 'npm:aws4fetch';

const allowedOrigins = [
	'https://neon-academy.sticklight.app',
	'https://academy.vibe-coding4elearning.com',
	'http://localhost:5173',
	'https://f2446c28-ba8f-49f3-86a8-9fd01bcb6af6.preview.sticklight.com',
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
	filename: string;
	mimeType: string;
	size: number;
	purpose?: 'media' | 'avatar'; // defaults to 'media'
}

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
	'image/png',
	'image/jpeg',
	'image/webp',
	'image/gif',
	'application/pdf',
];

// Size caps in bytes
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_PDF_SIZE = 25 * 1024 * 1024; // 25 MB

// Avatar-specific constants (no SVG, no PDF — SVG can carry script)
const AVATAR_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2 MB

const PRESIGN_EXPIRY = 600; // seconds

// Allowed roles for media upload
const ALLOWED_ROLES = ['super_admin', 'hr_manager', 'instructor'];

// Map MIME type to file extension
function getExtensionFromMime(mimeType: string): string {
	const map: Record<string, string> = {
		'image/png': 'png',
		'image/jpeg': 'jpg',
		'image/webp': 'webp',
		'image/gif': 'gif',
		'application/pdf': 'pdf',
	};
	return map[mimeType] || 'bin';
}

/**
 * Sanitize a filename for use as a display label.
 * Strips path separators, NUL bytes, and ..
 */
function sanitizeFilename(filename: string): string {
	if (!filename || filename.length === 0) return 'file';
	// Reject NUL bytes
	let sanitized = filename.replace(/\0/g, '');
	// Reject path traversal
	sanitized = sanitized.replace(/\.\./g, '');
	// Reject path separators
	sanitized = sanitized.replace(/[\/\\]/g, '');
	return sanitized || 'file';
}

console.info('Media presign function started [v1 media-presign]');

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

		// Parse request body first to determine purpose
		const body: PresignRequest = await req.json();
		const { filename, mimeType, size, purpose = 'media' } = body;

		// Branch on purpose
		let key: string;
		let kind: string;
		let sanitizedFilename: string;

		if (purpose === 'avatar') {
			// Avatar path: skip role check (any authenticated user), validate avatar constraints
			if (!mimeType || !AVATAR_MIME_TYPES.includes(mimeType)) {
				return new Response(
					JSON.stringify({ error: `Unsupported avatar type. Allowed: ${AVATAR_MIME_TYPES.join(', ')}` }),
					{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
				);
			}

			if (!size || size <= 0 || size > MAX_AVATAR_SIZE) {
				return new Response(
					JSON.stringify({ error: `Avatar size must be between 1 byte and ${MAX_AVATAR_SIZE / 1024 / 1024} MB` }),
					{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
				);
			}

			// Get extension from MIME type (never trust client extension)
			const ext = getExtensionFromMime(mimeType);

			// Generate key: avatars/{userId}/{uuid}.{ext}
			const fileId = crypto.randomUUID();
			key = `avatars/${userId}/${fileId}.${ext}`;
			kind = 'image';
			sanitizedFilename = sanitizeFilename(filename);

		} else {
			// Default 'media' path: check role, validate media constraints (unchanged from original)
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

			// Validate MIME type
			if (!mimeType || !ALLOWED_MIME_TYPES.includes(mimeType)) {
				return new Response(
					JSON.stringify({ error: `Unsupported file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}` }),
					{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
				);
			}

			// Validate size based on type
			const maxSize = mimeType === 'application/pdf' ? MAX_PDF_SIZE : MAX_IMAGE_SIZE;
			if (!size || size <= 0 || size > maxSize) {
				return new Response(
					JSON.stringify({ error: `File size must be between 1 byte and ${maxSize / 1024 / 1024} MB` }),
					{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
				);
			}

			// Derive kind from MIME type
			kind = mimeType === 'application/pdf' ? 'pdf' : 'image';

			// Sanitize filename (for display only, not used in key)
			sanitizedFilename = sanitizeFilename(filename);

			// Get extension from MIME type (never trust client extension)
			const ext = getExtensionFromMime(mimeType);

			// Generate key: media/{userId}/{uuid}.{ext}
			const fileId = crypto.randomUUID();
			key = `media/${userId}/${fileId}.${ext}`;
		}

		// Get R2 credentials from env
		const R2_ACCOUNT_ID = Deno.env.get('R2_ACCOUNT_ID')!;
		const R2_ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID')!;
		const R2_SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY')!;
		const R2_BUCKET = Deno.env.get('R2_BUCKET')!;
		const R2_PUBLIC_BASE_URL = Deno.env.get('R2_PUBLIC_BASE_URL')!;

		// Create AWS client for presigning
		const awsClient = new AwsClient({
			accessKeyId: R2_ACCESS_KEY_ID,
			secretAccessKey: R2_SECRET_ACCESS_KEY,
		});

		const r2Endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

		// X-Amz-Expires MUST be a QUERY parameter, not a header.
		const url = new URL(`${r2Endpoint}/${R2_BUCKET}/${key}`);
		url.searchParams.set('X-Amz-Expires', String(PRESIGN_EXPIRY));

		const signed = await awsClient.sign(url.toString(), {
			method: 'PUT',
			aws: { signQuery: true },
		});

		const publicUrl = `${R2_PUBLIC_BASE_URL}/${key}`;

		return new Response(
			JSON.stringify({ uploadUrl: signed.url, key, publicUrl, filename: sanitizedFilename, kind }),
			{ status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	} catch (err) {
		console.error('Media presign error:', err);
		return new Response(
			JSON.stringify({ error: 'Internal server error' }),
			{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	}
});
