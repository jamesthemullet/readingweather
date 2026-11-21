import { describe, expect, it } from 'vitest';
import { findGalleryHref, hasGalleryImage } from './galleryMatch';

describe('hasGalleryImage', () => {
	it('returns false when there is no featured image', () => {
		expect(hasGalleryImage({})).toBe(false);
		expect(hasGalleryImage({ featuredImage: {} })).toBe(false);
		expect(hasGalleryImage({ featuredImage: { node: {} } })).toBe(false);
	});

	it('returns false for PXL phone-camera filenames', () => {
		expect(
			hasGalleryImage({ featuredImage: { node: { sourceUrl: 'https://example.com/PXL_20230101.jpg' } } })
		).toBe(false);
	});

	it('returns true for a normal image filename', () => {
		expect(
			hasGalleryImage({ featuredImage: { node: { sourceUrl: 'https://example.com/sunny-day.jpg' } } })
		).toBe(true);
	});
});

describe('findGalleryHref', () => {
	it('returns null when the post has no gallery-eligible image', () => {
		expect(findGalleryHref({ date: '2023-06-15' })).toBeNull();
	});

	it('returns a year-scoped gallery link when the post has a gallery-eligible image', () => {
		const href = findGalleryHref({
			date: '2023-06-15',
			featuredImage: { node: { sourceUrl: 'https://example.com/sunny-day.jpg' } }
		});
		expect(href).toBe('/gallery?year=2023');
	});

	it('returns null when the post has a PXL image', () => {
		const href = findGalleryHref({
			date: '2023-06-15',
			featuredImage: { node: { sourceUrl: 'https://example.com/PXL_20230615.jpg' } }
		});
		expect(href).toBeNull();
	});

	it('returns null for an unparseable date', () => {
		const href = findGalleryHref({
			date: 'not-a-date',
			featuredImage: { node: { sourceUrl: 'https://example.com/sunny-day.jpg' } }
		});
		expect(href).toBeNull();
	});
});
