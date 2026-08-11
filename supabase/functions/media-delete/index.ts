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

interface DeleteRequest {
	id: string;
}

// Allowed roles for media management
const ALLOWED_ROLES = ['super_admin', 'hr_manager', 'instructor'];

console.info('Media delete function started [v1 media-delete]');

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
		const body: DeleteRequest = await req.json();
		const { id } = body;

		if (!id || typeof id !== 'string') {
			return new Response(
				JSON.stringify({ error: 'Missing or invalid id' }),
				{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		// Fetch the media_assets row by id
		const { data: assetRow, error: fetchError } = await supabaseService
			.from('media_assets')
			.select('*')
			.eq('id', id)
			.single();

		if (fetchError || !assetRow) {
			return new Response(
				JSON.stringify({ error: 'Media asset not found' }),
				{ status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		// ⚠️ AUTHORISATION: service client bypasses RLS, so enforce in code
		// Allow delete only if: owner_id === userId OR role === 'super_admin'
		const isOwner = assetRow.owner_id === userId;
		const isSuperAdmin = userRole === 'super_admin';

		if (!isOwner && !isSuperAdmin) {
			return new Response(
				JSON.stringify({ error: 'You do not have permission to delete this file' }),
				{ status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		// Get R2 credentials from env
		const R2_ACCOUNT_ID = Deno.env.get('R2_ACCOUNT_ID')!;
		const R2_ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID')!;
		const R2_SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY')!;
		const R2_BUCKET = Deno.env.get('R2_BUCKET')!;

		// Create AWS client for DELETE request
		const awsClient = new AwsClient({
			accessKeyId: R2_ACCESS_KEY_ID,
			secretAccessKey: R2_SECRET_ACCESS_KEY,
		});

		const r2Endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
		const deleteUrl = `${r2Endpoint}/${R2_BUCKET}/${assetRow.r2_key}`;

		// Delete the R2 object
		try {
			const deleteRequest = await awsClient.sign(deleteUrl, { method: 'DELETE' });
			const deleteResponse = await fetch(deleteRequest);

			// If R2 returns 404, continue — the object is already gone
			// Any other non-2xx error: abort with 500, don't delete the row
			if (!deleteResponse.ok && deleteResponse.status !== 404) {
				console.error('R2 delete failed:', deleteResponse.status, deleteResponse.statusText);
				return new Response(
					JSON.stringify({ error: 'Failed to delete file from storage' }),
					{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
				);
			}
		} catch (r2Err) {
			console.error('R2 delete error:', r2Err);
			return new Response(
				JSON.stringify({ error: 'Failed to delete file from storage' }),
				{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		// Delete the media_assets row
		const { error: deleteError } = await supabaseService
			.from('media_assets')
			.delete()
			.eq('id', id);

		if (deleteError) {
			console.error('DB delete error:', deleteError);
			return new Response(
				JSON.stringify({ error: 'Failed to delete media asset record' }),
				{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		return new Response(
			JSON.stringify({ success: true }),
			{ status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	} catch (err) {
		console.error('Media delete error:', err);
		return new Response(
			JSON.stringify({ error: 'Internal server error' }),
			{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	}
});
