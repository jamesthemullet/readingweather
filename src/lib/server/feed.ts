import { fetchGraphQL } from '$lib/graphql/api';
import { getCache, setCache } from './cache';

const ALL_POSTS_FEED_QUERY = `
  query AllPostsForFeed {
    posts(first: 50) {
      nodes {
        slug
        title
        date
        excerpt
        featuredImage {
          node {
            sourceUrl(size: MEDIUM_LARGE)
          }
        }
      }
    }
  }
`;

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export type FeedNode = {
	slug: string;
	title: string;
	date: string | null;
	excerpt?: string | null;
	featuredImage?: { node?: { sourceUrl?: string } };
};

function escapeXml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

function stripHtml(value: string): string {
	return value.replace(/<[^>]*>/g, '').trim();
}

function toRssItem(node: FeedNode, base: string): string {
	const link = `${base}/${node.slug}`;
	const pubDate = node.date ? new Date(node.date).toUTCString() : undefined;
	const description = node.excerpt ? stripHtml(node.excerpt) : '';
	const imageUrl = node.featuredImage?.node?.sourceUrl;

	return `
    <item>
      <title>${escapeXml(node.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      ${pubDate ? `<pubDate>${pubDate}</pubDate>` : ''}
      <description>${escapeXml(description)}</description>
      ${imageUrl ? `<enclosure url="${escapeXml(imageUrl)}" type="image/jpeg" />` : ''}
    </item>`;
}

export async function fetchFeedPosts(): Promise<FeedNode[]> {
	const cached = getCache<FeedNode[]>('feed-posts');
	if (cached) return cached;

	const data = await fetchGraphQL<{ posts: { nodes: FeedNode[] } }>(ALL_POSTS_FEED_QUERY);
	const nodes = data.posts.nodes;
	setCache('feed-posts', nodes, CACHE_TTL_MS);
	return nodes;
}

export function generateFeedXml(nodes: FeedNode[], base: string): string {
	const items = nodes.map((node) => toRssItem(node, base));
	const lastBuildDate = new Date().toUTCString();

	return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Reading Weather</title>
    <link>${base}</link>
    <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml" />
    <description>Weather forecasts for Reading and Berkshire</description>
    <language>en-gb</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
${items.join('\n')}
  </channel>
</rss>`;
}
