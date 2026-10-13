import { error } from '@sveltejs/kit';
import { getTool, tools } from '$lib/content/tools';
import type { PageLoad } from './$types';

export const prerender = true;

export function entries() {
	return tools.map((tool) => ({ tool: tool.slug }));
}

export const load: PageLoad = ({ params }) => {
	const tool = getTool(params.tool);
	if (!tool) error(404, 'Không tìm thấy công cụ');
	return { tool };
};
