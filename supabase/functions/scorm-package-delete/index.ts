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

// ⚠️ ONLY super_admin and hr_manager — instructors CANNOT delete packages
const ALLOWED_ROLES = ['super_admin', 'hr_manager'];

console.info('SCORM package delete function started [v1 scorm-package-delete]');

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
		// 1. 401 without Authorization header
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

		// Resolve user from JWT
		const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
		if (authError || !user) {
			return new Response(
				JSON.stringify({ error: 'Invalid or expired token' }),
				{ status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		const userId = user.id;

		// 2. Check user role via user_roles table using SERVICE client
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
		const body: DeleteRequest = await req.json();
		const { id } = body;

		if (!id || typeof id !== 'string') {
			return new Response(
				JSON.stringify({ error: 'Missing or invalid id' }),
				{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		// 3. Fetch the scorm_packages row; 404 if absent
		const { data: packageRow, error: fetchError } = await supabaseService
			.from('scorm_packages')
			.select('*')
			.eq('id', id)
			.single();

		if (fetchError || !packageRow) {
			return new Response(
				JSON.stringify({ error: 'SCORM package not found' }),
				{ status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		// 4. ⚠️ THE SAFETY GATE — enforce in code, service client bypasses RLS
		// Count scorm_registrations referencing this package
		const { count: registrationsCount, error: regCountError } = await supabaseService
			.from('scorm_registrations')
			.select('*', { count: 'exact', head: true })
			.eq('package_id', id);

		if (regCountError) {
			console.error('Failed to count registrations:', regCountError);
			return new Response(
				JSON.stringify({ error: 'Failed to check package usage' }),
				{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		// Count modules referencing this package
		const { count: modulesCount, error: modCountError } = await supabaseService
			.from('modules')
			.select('*', { count: 'exact', head: true })
			.eq('scorm_package_id', id);

		if (modCountError) {
			console.error('Failed to count modules:', modCountError);
			return new Response(
				JSON.stringify({ error: 'Failed to check package usage' }),
				{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		const registrations = registrationsCount ?? 0;
		const modules = modulesCount ?? 0;

		// If EITHER count is greater than zero, return 409
		if (registrations > 0 || modules > 0) {
			return new Response(
				JSON.stringify({
					error: 'Package is in use and cannot be deleted',
					registrations,
					modules,
				}),
				{ status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		// 5. Delete the package's R2 objects under prefix `packages/${id}/`
		const R2_ACCOUNT_ID = Deno.env.get('R2_ACCOUNT_ID')!;
		const R2_ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID')!;
		const R2_SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY')!;
		const R2_BUCKET = Deno.env.get('R2_BUCKET')!;

		const awsClient = new AwsClient({
			accessKeyId: R2_ACCESS_KEY_ID,
			secretAccessKey: R2_SECRET_ACCESS_KEY,
		});

		const r2Endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
		const prefix = `packages/${id}/`;

		try {
			let continuationToken: string | null = null;

			// List and delete all objects under the prefix, handling pagination
			do {
				let listUrl = `${r2Endpoint}/${R2_BUCKET}?list-type=2&prefix=${encodeURIComponent(prefix)}`;
				if (continuationToken) {
					listUrl += `&continuation-token=${encodeURIComponent(continuationToken)}`;
				}

				const listRequest = await awsClient.sign(listUrl, { method: 'GET' });
				const listResponse = await fetch(listRequest);

				if (!listResponse.ok) {
					console.error('R2 list failed:', listResponse.status, listResponse.statusText);
					return new Response(
						JSON.stringify({ error: 'Failed to list package files from storage' }),
						{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
					);
				}

				const listXml = await listResponse.text();

				// Parse keys from XML response
				const keyMatches = listXml.matchAll(/<Key>([^<]+)<\/Key>/g);
				const keys: string[] = [];
				for (const match of keyMatches) {
					keys.push(match[1]);
				}

				// Delete each object
				for (const key of keys) {
					const deleteUrl = `${r2Endpoint}/${R2_BUCKET}/${key}`;
					const deleteRequest = await awsClient.sign(deleteUrl, { method: 'DELETE' });
					const deleteResponse = await fetch(deleteRequest);

					// 404 is fine — object already gone. Any other non-2xx aborts.
					if (!deleteResponse.ok && deleteResponse.status !== 404) {
						console.error('R2 delete failed for key:', key, deleteResponse.status, deleteResponse.statusText);
						return new Response(
							JSON.stringify({ error: 'Failed to delete package files from storage' }),
							{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
						);
					}
				}

				// Check for NextContinuationToken
				const tokenMatch = listXml.match(/<NextContinuationToken>([^<]+)<\/NextContinuationToken>/);
				continuationToken = tokenMatch ? tokenMatch[1] : null;

			} while (continuationToken);

		} catch (r2Err) {
			console.error('R2 delete error:', r2Err);
			return new Response(
				JSON.stringify({ error: 'Failed to delete package files from storage' }),
				{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		// 6. Delete the scorm_packages row with the SERVICE client
		const { error: deleteError } = await supabaseService
			.from('scorm_packages')
			.delete()
			.eq('id', id);

		if (deleteError) {
			console.error('DB delete error:', deleteError);
			return new Response(
				JSON.stringify({ error: 'Failed to delete SCORM package record' }),
				{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		return new Response(
			JSON.stringify({ success: true }),
			{ status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	} catch (err) {
		console.error('SCORM package delete error:', err);
		return new Response(
			JSON.stringify({ error: 'Internal server error' }),
			{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	}
});
