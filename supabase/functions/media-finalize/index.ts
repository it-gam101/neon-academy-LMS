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
	key: string;
	filename: string;
	mimeType: string;
	size: number;
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

// Allowed roles for media upload
const ALLOWED_ROLES = ['super_admin', 'hr_manager', 'instructor'];

console.info('Media finalize function started [v1 media-finalize]');

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

		// Parse request body
		const body: FinalizeRequest = await req.json();
		const { key, filename, mimeType, size } = body;

		// Re-validate MIME type
		if (!mimeType || !ALLOWED_MIME_TYPES.includes(mimeType)) {
			return new Response(
				JSON.stringify({ error: `Unsupported file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}` }),
				{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		// Re-validate size
		const maxSize = mimeType === 'application/pdf' ? MAX_PDF_SIZE : MAX_IMAGE_SIZE;
		if (!size || size <= 0 || size > maxSize) {
			return new Response(
				JSON.stringify({ error: `File size must be between 1 byte and ${maxSize / 1024 / 1024} MB` }),
				{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		// Validate key format
		if (!key || typeof key !== 'string' || !key.startsWith('media/')) {
			return new Response(
				JSON.stringify({ error: 'Invalid key format' }),
				{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		// Derive kind from MIME type
		const kind = mimeType === 'application/pdf' ? 'pdf' : 'image';

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

		// Verify the upload landed by HEAD request
		const headUrl = `${r2Endpoint}/${R2_BUCKET}/${key}`;

		try {
			const headRequest = await awsClient.sign(headUrl, { method: 'HEAD' });
			const headResponse = await fetch(headRequest);

			if (!headResponse.ok) {
				return new Response(
					JSON.stringify({ error: 'Uploaded file not found in storage' }),
					{ status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
				);
			}
		} catch (headErr) {
			console.error('HEAD request failed:', headErr);
			return new Response(
				JSON.stringify({ error: 'Uploaded file not found in storage' }),
				{ status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		// Build public URL
		const url = `${R2_PUBLIC_BASE_URL}/${key}`;

		// Insert media_assets row
		const { data: assetData, error: insertError } = await supabaseService
			.from('media_assets')
			.insert({
				owner_id: userId,
				kind,
				r2_key: key,
				url,
				filename,
				mime_type: mimeType,
				size_bytes: size,
			})
			.select()
			.single();

		if (insertError) {
			console.error('Media asset insert error:', insertError);
			return new Response(
				JSON.stringify({ error: 'Failed to create media asset record' }),
				{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		return new Response(
			JSON.stringify(assetData),
			{ status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	} catch (err) {
		console.error('Media finalize error:', err);
		return new Response(
			JSON.stringify({ error: 'Internal server error' }),
			{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	}
});
