// A single continuous-range request covering many years of history takes a few
// seconds to generate upstream, so give it more headroom than a single-day fetch.
export const REQUEST_TIMEOUT_MS = 20000;

// A request spanning many years of history is heavy enough that browsing the site
// in quick succession can trip Open-Meteo's rate limit. Retry a 429 a couple of
// times, honouring Retry-After when the upstream sends one, rather than surfacing a
// spurious failure for what is otherwise a valid request.
const MAX_ATTEMPTS = 3;

export async function fetchArchive(url: string): Promise<Response> {
	for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
		const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
		if (response.status !== 429 || attempt === MAX_ATTEMPTS) return response;

		const retryAfterSeconds = Number(response.headers.get('retry-after'));
		const delayMs = retryAfterSeconds > 0 ? retryAfterSeconds * 1000 : attempt * 1000;
		await new Promise((resolve) => setTimeout(resolve, delayMs));
	}
	// Unreachable: the loop always returns on the final attempt. TypeScript cannot
	// prove this because MAX_ATTEMPTS is a runtime constant, not a literal in the
	// loop bounds, so an explicit throw satisfies the control-flow analysis.
	throw new Error('Unexpected: fetchArchive retry loop exhausted without returning');
}
