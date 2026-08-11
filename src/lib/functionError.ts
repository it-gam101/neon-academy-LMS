export async function functionErrorMessage(err: unknown, fallback: string): Promise<string> {
	// FunctionsHttpError carries the Response on `context`
	const ctx = (err as { context?: Response })?.context;
	if (ctx && typeof ctx.json === 'function') {
		try {
			const body = await ctx.json();
			if (body?.error) return String(body.error);
		} catch { /* body was not JSON */ }
	}
	const msg = (err as { message?: string })?.message;
	return msg || fallback;
}
