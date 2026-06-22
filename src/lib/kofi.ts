const KOFI_IFRAME_HTML = `<iframe id='kofiframe' src='https://ko-fi.com/wffrb/?hidefeed=true&widget=true&embed=true&preview=true' style='border:none;width:100%;padding:4px;background:#f9f9f9;' height='612' title='Support Reading Weather on Ko-fi'></iframe>`;

export function injectKofiWidget(content: string): string {
	const paragraphs = content.split(/<\/?p>/).filter((p) => p.trim() !== '');
	if (paragraphs.length > 2) {
		paragraphs.splice(-3, 0, KOFI_IFRAME_HTML);
	}
	return paragraphs.map((p) => `<p>${p}</p>`).join('');
}
