import { Resend } from 'resend';
import { EMAIL_FROM_ADDRESS, RESEND_API_KEY } from '$app/env/private';

export type EmailMessage = {
	to: string;
	subject: string;
	html: string;
};

export async function sendEmail({ to, subject, html }: EmailMessage): Promise<void> {
	const apiKey = RESEND_API_KEY;
	const from = EMAIL_FROM_ADDRESS;

	if (!apiKey || !from) {
		throw new Error(
			'Email provider is not configured: set RESEND_API_KEY and EMAIL_FROM_ADDRESS'
		);
	}

	const resend = new Resend(apiKey);
	const { error } = await resend.emails.send({ from, to, subject, html });

	if (error) {
		throw new Error(`Failed to send email: ${error.message}`);
	}
}
