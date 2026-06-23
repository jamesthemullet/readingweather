import { describe, expect, it } from 'vitest';
import { generateSitemapXml } from './sitemap';
import type { SitemapNode, StaticRoute } from './sitemap';

const BASE = 'https://readingweather.co.uk';

describe('generateSitemapXml', () => {
	it('produces a valid XML document with the correct urlset wrapper', () => {
		const xml = generateSitemapXml([], [], BASE);
		expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
		expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
		expect(xml).toContain('</urlset>');
	});

	it('includes static routes with their loc, changefreq, and priority', () => {
		const staticRoutes: StaticRoute[] = [
			{ path: '/about', changefreq: 'yearly', priority: '0.5' },
			{ path: '/archives', changefreq: 'daily', priority: '0.8' }
		];
		const xml = generateSitemapXml([], staticRoutes, BASE);
		expect(xml).toContain(`${BASE}/about`);
		expect(xml).toContain('<changefreq>yearly</changefreq>');
		expect(xml).toContain('<priority>0.5</priority>');
		expect(xml).toContain(`${BASE}/archives`);
		expect(xml).toContain('<changefreq>daily</changefreq>');
	});

	it('includes post slugs with lastmod from the first 10 chars of date when date is present', () => {
		const nodes: SitemapNode[] = [{ slug: 'reading-flood-march', date: '2025-03-15T08:00:00' }];
		const xml = generateSitemapXml(nodes, [], BASE);
		expect(xml).toContain(`${BASE}/reading-flood-march`);
		expect(xml).toContain('<lastmod>2025-03-15</lastmod>');
	});

	it('omits lastmod entirely when node.date is null', () => {
		const nodes: SitemapNode[] = [{ slug: 'undated-post', date: null }];
		const xml = generateSitemapXml(nodes, [], BASE);
		expect(xml).toContain(`${BASE}/undated-post`);
		expect(xml).not.toContain('<lastmod>');
	});

	it('escapes XML special characters in slug-derived URLs', () => {
		const nodes: SitemapNode[] = [{ slug: 'rain-&-shine', date: null }];
		const xml = generateSitemapXml(nodes, [], BASE);
		expect(xml).toContain('rain-&amp;-shine');
		expect(xml).not.toContain('rain-&-shine');
	});
});
