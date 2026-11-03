const FALLBACK_ALT = 'Weather chart from a Reading Weather post';

const ALT_ATTR = /\balt\s*=\s*("[^"]*"|'[^']*'|\S*)/i;

export function ensureImageAltText(html: string, fallbackAlt: string = FALLBACK_ALT): string {
	return html.replace(/<img\b[^>]*>/gi, (imgTag) => {
		const altMatch = imgTag.match(ALT_ATTR);
		if (!altMatch) {
			return imgTag.replace(/<img\b/i, `<img alt="${fallbackAlt}"`);
		}

		const altValue = altMatch[1].replace(/^['"]|['"]$/g, '');
		if (altValue.trim() !== '') {
			return imgTag;
		}

		return imgTag.replace(ALT_ATTR, `alt="${fallbackAlt}"`);
	});
}
