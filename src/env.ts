import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	RESEND_API_KEY: {
		schema: (value) => value || undefined,
		description: 'API key for the Resend email provider, used to send the monthly digest email.'
	},
	EMAIL_FROM_ADDRESS: {
		schema: (value) => value || undefined,
		description: 'The "from" address the monthly digest email is sent from.'
	}
});
