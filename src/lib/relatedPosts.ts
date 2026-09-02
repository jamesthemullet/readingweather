import type { AllPostsNode } from '$lib/types';

const DEFAULT_LIMIT = 3;

/**
 * Given the current post and a pool of candidate posts/photos, returns the
 * ones closest in time to it (nearest date first), excluding the current
 * post itself and capped at `limit`.
 */
export function findRelatedPosts<T extends Pick<AllPostsNode, 'slug' | 'date'>>(
	current: Pick<AllPostsNode, 'slug' | 'date'>,
	candidates: T[],
	limit = DEFAULT_LIMIT
): T[] {
	const currentTime = new Date(current.date).getTime();

	return candidates
		.filter((post) => post.slug !== current.slug)
		.map((post) => ({ post, distance: Math.abs(new Date(post.date).getTime() - currentTime) }))
		.sort((a, b) => a.distance - b.distance)
		.slice(0, limit)
		.map(({ post }) => post);
}
