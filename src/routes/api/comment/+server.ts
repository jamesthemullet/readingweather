import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { addComment } from '$lib/graphql/api';

const ALLOWED_ORIGIN = 'https://www.readingweather.co.uk';

export const POST: RequestHandler = async ({ request }) => {
	// CSRF: reject requests whose Origin doesn't match the app's own origin.
	const origin = request.headers.get('origin') ?? '';
	const host = request.headers.get('host') ?? '';
	const isLocalDev = host.startsWith('localhost') || host.startsWith('127.0.0.1');

	if (!isLocalDev && origin !== ALLOWED_ORIGIN) {
		return json({ message: 'Forbidden' }, { status: 403 });
	}

	let body: { postId?: unknown; content?: unknown; name?: unknown; email?: unknown; parentCommentId?: unknown };
	try {
		body = await request.json();
	} catch {
		return json({ message: 'Invalid request body' }, { status: 400 });
	}

	// Decode and validate the base64 post ID
	const rawPostId = typeof body.postId === 'string' ? body.postId : '';
	let decodedPostId: number;
	try {
		const decoded = atob(rawPostId).split(':')[1];
		decodedPostId = Number.parseInt(decoded, 10);
		if (!Number.isFinite(decodedPostId) || decodedPostId <= 0) {
			throw new Error('Invalid post ID');
		}
	} catch {
		return json({ message: 'Invalid post ID' }, { status: 400 });
	}

	const content = typeof body.content === 'string' ? body.content.trim().slice(0, 5000) : '';
	const name = typeof body.name === 'string' ? body.name.trim().slice(0, 100) : '';
	const email = typeof body.email === 'string' ? body.email.trim().slice(0, 254) : '';
	const parentCommentId =
		body.parentCommentId != null && typeof body.parentCommentId === 'number'
			? body.parentCommentId
			: null;

	if (!content || !name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		return json({ message: 'Name, valid email, and comment content are required' }, { status: 400 });
	}

	try {
		const result = await addComment(decodedPostId, content, name, email, parentCommentId);
		if (result.success) {
			return json({ success: true });
		}
		return json({ success: false, message: 'Failed to submit comment' }, { status: 422 });
	} catch {
		return json({ message: 'Error submitting comment. Please try again.' }, { status: 502 });
	}
};
