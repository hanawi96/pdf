<script lang="ts">
	import type { ToolDefinition } from '$lib/content/tools';
	import { toolIcons } from './icons';

	let { tool }: { tool: ToolDefinition } = $props();
	const Icon = $derived(toolIcons[tool.id]);
</script>

<a
	href="/{tool.slug}"
	class="bg-card text-card-foreground ring-foreground/10 hover:ring-primary/40 group flex h-full flex-col rounded-xl p-5 shadow-xs ring-1 transition duration-200 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
>
	<span
		class="bg-primary/10 text-primary mb-4 inline-flex size-10 items-center justify-center rounded-lg"
	>
		<Icon class="size-5" />
	</span>
	<span class="text-base font-semibold tracking-tight">{tool.title}</span>
	<span class="text-muted-foreground mt-2 text-sm leading-6">{tool.short}</span>
</a>
