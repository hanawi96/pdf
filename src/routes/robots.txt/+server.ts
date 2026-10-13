import { PUBLIC_SITE_URL } from '$app/env/public';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = ({ url }) => {
	const origin = PUBLIC_SITE_URL || url.origin;
	return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`, {
		headers: { 'content-type': 'text/plain; charset=utf-8' }
	});
};
