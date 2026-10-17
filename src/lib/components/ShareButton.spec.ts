import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ShareButton from './ShareButton.svelte';

const postUrl = 'https://www.readingweather.co.uk/some-post';
const postTitle = 'Some Post';
const postSummary = 'A summary of the post';

describe('ShareButton', () => {
	function stubClipboard(writeText: (text: string) => Promise<void>): void {
		Object.defineProperty(navigator, 'clipboard', {
			value: { writeText },
			configurable: true
		});
	}

	beforeEach(() => {
		vi.stubGlobal('open', vi.fn());
		stubClipboard(vi.fn().mockResolvedValue(undefined));
	});

	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('copies the post url to the clipboard and shows confirmation', async () => {
		render(ShareButton, { props: { postUrl, postTitle, postSummary } });

		await fireEvent.click(screen.getByRole('button', { name: 'Copy link to this forecast' }));

		expect(navigator.clipboard.writeText).toHaveBeenCalledWith(postUrl);
		expect(await screen.findByText('Copied!')).toBeTruthy();
	});

	it('shows a manual-copy error when the clipboard write fails', async () => {
		stubClipboard(vi.fn().mockRejectedValue(new Error('denied')));
		render(ShareButton, { props: { postUrl, postTitle, postSummary } });

		await fireEvent.click(screen.getByRole('button', { name: 'Copy link to this forecast' }));

		expect(await screen.findByRole('alert')).toHaveProperty(
			'textContent',
			'Could not copy link — please copy it manually.'
		);
	});

	it('opens Bluesky share intent with the post summary and url', async () => {
		render(ShareButton, { props: { postUrl, postTitle, postSummary } });

		await fireEvent.click(screen.getByRole('button', { name: /Share this forecast on Bluesky/ }));

		expect(window.open).toHaveBeenCalledWith(
			`https://bsky.app/intent/compose?text=${encodeURIComponent(`${postSummary} ${postUrl}`)}`,
			'_blank',
			'noopener,noreferrer'
		);
	});

	it('opens Facebook share intent with the post url', async () => {
		render(ShareButton, { props: { postUrl, postTitle, postSummary } });

		await fireEvent.click(screen.getByRole('button', { name: /Share this forecast on Facebook/ }));

		expect(window.open).toHaveBeenCalledWith(
			`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`,
			'_blank',
			'noopener,noreferrer'
		);
	});

	it('tracks the share click via gtag when a card prop is supplied', async () => {
		const gtag = vi.fn();
		vi.stubGlobal('gtag', gtag);
		render(ShareButton, { props: { postUrl, postTitle, postSummary, card: 'post-footer' } });

		await fireEvent.click(screen.getByRole('button', { name: /Share this forecast on WhatsApp/ }));

		expect(gtag).toHaveBeenCalledWith('event', 'share_click', { card: 'post-footer' });
	});
});
