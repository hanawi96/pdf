import { PUBLIC_SITE_URL } from '$app/env/public';
import { tools } from '$lib/content/tools';
import type { RequestHandler } from './$types';

export const prerender = false;

const staticPaths = ['/', '/gioi-thieu', '/quyen-rieng-tu', '/dieu-khoan'];

export const GET: RequestHandler = ({ url }) => {
	const origin = PUBLIC_SITE_URL || url.origin;
	const paths = [...staticPaths, ...tools.map((tool) => `/${tool.slug}`)];
	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths
	.map(
		(path) => `  <url><loc>${origin}${path}</loc><changefreq>weekly</changefreq></url>`
	)
	.join('\n')}
</urlset>`;

	return new Response(body, {
		headers: {
			'content-type': 'application/xml; charset=utf-8',
			'cache-control': 'public, max-age=3600'
		}
	});
};
