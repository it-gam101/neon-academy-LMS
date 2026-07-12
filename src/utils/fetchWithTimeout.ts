/**
 * Wraps a promise or PromiseLike (like Supabase query builders) with a timeout.
 * If it doesn't resolve within the specified time, it rejects with a timeout error.
 */
export async function withTimeout<T>(
	promiseOrThenable: Promise<T> | PromiseLike<T>,
	timeoutMs: number = 10000
): Promise<T> {
	let timeoutId: ReturnType<typeof setTimeout>;

	// Convert PromiseLike to true Promise for Promise.race compatibility
	const promise = Promise.resolve(promiseOrThenable);

	const timeoutPromise = new Promise<never>((_, reject) => {
		timeoutId = setTimeout(() => {
			reject(new Error('TIMEOUT'));
		}, timeoutMs);
	});

	try {
		const result = await Promise.race([promise, timeoutPromise]);
		clearTimeout(timeoutId!);
		return result;
	} catch (error) {
		clearTimeout(timeoutId!);
		throw error;
	}
}

/**
 * Creates an AbortController-based timeout for fetch operations.
 * Returns a cleanup function that should be called in finally block.
 */
export function createQueryTimeout(timeoutMs: number = 10000): {
	timeoutPromise: Promise<never>;
	clear: () => void;
} {
	let timeoutId: ReturnType<typeof setTimeout>;
	let rejectFn: (reason: Error) => void;

	const timeoutPromise = new Promise<never>((_, reject) => {
		rejectFn = reject;
		timeoutId = setTimeout(() => {
			reject(new Error('TIMEOUT'));
		}, timeoutMs);
	});

	return {
		timeoutPromise,
		clear: () => clearTimeout(timeoutId),
	};
}
