import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

const ALLOWED_ORIGIN = 'https://www.readingweather.co.uk';
const SUBSCRIBE_URL = 'https://blog.readingweather.co.uk/wp-json/custom/v1/subscribe';

export const POST: RequestHandler = async ({ request }) => {
	// CSRF: reject requests whose Origin doesn't match the app's own origin.
	// Browsers always send Origin on cross-site POST requests, so a forged form
	// from another domain will be blocked here. Requests from the same origin
	// (or localhost in dev) are allowed through.
	const origin = request.headers.get('origin') ?? '';
	const host = request.headers.get('host') ?? '';
	const isLocalDev = host.startsWith('localhost') || host.startsWith('127.0.0.1');

	if (!isLocalDev && origin !== ALLOWED_ORIGIN) {
		return json({ message: 'Forbidden' }, { status: 403 });
	}

	let body: { name?: unknown; email?: unknown };
	try {
		body = await request.json();
	} catch {
		return json({ message: 'Invalid request body' }, { status: 400 });
	}

	const name = typeof body.name === 'string' ? body.name.trim().slice(0, 100) : '';
	const email = typeof body.email === 'string' ? body.email.trim().slice(0, 254) : '';

	if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		return json({ message: 'Name and a valid email address are required' }, { status: 400 });
	}

	try {
		const res = await fetch(SUBSCRIBE_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name, email })
		});

		const data = await res.json();
		return json({ message: data.message ?? 'Subscribed successfully' }, { status: res.status });
	} catch {
		return json({ message: 'Something went wrong. Please try again.' }, { status: 502 });
	}
};
