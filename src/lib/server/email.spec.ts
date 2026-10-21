import { beforeEach, describe, expect, it, vi } from 'vitest';

const { sendMock, mockEnv } = vi.hoisted(() => ({
	sendMock: vi.fn(),
	mockEnv: {
		RESEND_API_KEY: undefined as string | undefined,
		EMAIL_FROM_ADDRESS: undefined as string | undefined
	}
}));

vi.mock('resend', () => ({
	Resend: vi.fn().mockImplementation(function Resend() {
		return { emails: { send: sendMock } };
	})
}));

vi.mock('$app/env/private', () => mockEnv);

import { sendEmail } from './email';

beforeEach(() => {
	sendMock.mockReset();
	mockEnv.RESEND_API_KEY = 'test-api-key';
	mockEnv.EMAIL_FROM_ADDRESS = 'digest@readingweather.co.uk';
});

describe('sendEmail', () => {
	it('sends via the configured provider and from address', async () => {
		sendMock.mockResolvedValue({ data: { id: '123' }, error: null });

		await sendEmail({ to: 'reader@example.com', subject: 'Hello', html: '<p>Hi</p>' });

		expect(sendMock).toHaveBeenCalledWith({
			from: 'digest@readingweather.co.uk',
			to: 'reader@example.com',
			subject: 'Hello',
			html: '<p>Hi</p>'
		});
	});

	it('throws when the API key is not configured', async () => {
		mockEnv.RESEND_API_KEY = undefined;

		await expect(
			sendEmail({ to: 'reader@example.com', subject: 'Hello', html: '<p>Hi</p>' })
		).rejects.toThrow('Email provider is not configured');
		expect(sendMock).not.toHaveBeenCalled();
	});

	it('throws when the from address is not configured', async () => {
		mockEnv.EMAIL_FROM_ADDRESS = undefined;

		await expect(
			sendEmail({ to: 'reader@example.com', subject: 'Hello', html: '<p>Hi</p>' })
		).rejects.toThrow('Email provider is not configured');
		expect(sendMock).not.toHaveBeenCalled();
	});

	it('throws when the provider returns an error', async () => {
		sendMock.mockResolvedValue({ data: null, error: { message: 'invalid recipient' } });

		await expect(
			sendEmail({ to: 'not-an-email', subject: 'Hello', html: '<p>Hi</p>' })
		).rejects.toThrow('invalid recipient');
	});
});
