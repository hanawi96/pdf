import { defineEnvVars } from '@sveltejs/kit/env';

const optional = (value: string | undefined) => value ?? '';

export const variables = defineEnvVars({
	PUBLIC_SITE_URL: {
		public: true,
		description: 'Canonical origin used in sitemap and metadata.',
		schema: optional
	},
	PUBLIC_ADSENSE_CLIENT: {
		public: true,
		description: 'Google AdSense client id. Leave empty to hide ads.',
		schema: optional
	},
	PUBLIC_ADSENSE_SLOT_HOME: {
		public: true,
		description: 'AdSense slot on the homepage.',
		schema: optional
	},
	PUBLIC_ADSENSE_SLOT_TOOL: {
		public: true,
		description: 'AdSense slot on tool pages.',
		schema: optional
	},
	QPDF_INTERNAL_URL: {
		public: false,
		description: 'Internal URL of the qpdf backend.',
		schema: (value: string | undefined) => value || 'http://127.0.0.1:8787'
	}
});
