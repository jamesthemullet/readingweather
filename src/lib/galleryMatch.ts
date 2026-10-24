export type GalleryEligiblePost = {
	featuredImage?: { node?: { sourceUrl?: string } };
};

/** Mirrors the gallery page's own filter: has a featured image, and it's not a raw phone-camera (PXL) shot. */
export function hasGalleryImage(post: GalleryEligiblePost): boolean {
	const sourceUrl = post.featuredImage?.node?.sourceUrl;
	if (!sourceUrl) return false;
	const filename = sourceUrl.split('/').pop() ?? '';
	return !/PXL/i.test(filename);
}

/** Gallery link for a post's own date, or null when the post has no image the gallery would show. */
export function findGalleryHref(post: GalleryEligiblePost & { date: string }): string | null {
	if (!hasGalleryImage(post)) return null;
	const year = new Date(post.date).getFullYear();
	if (Number.isNaN(year)) return null;
	return `/gallery?year=${year}`;
}
