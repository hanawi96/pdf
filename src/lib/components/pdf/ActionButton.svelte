<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { Button } from '$lib/components/ui/button';

	let {
		children,
		class: className = '',
		...rest
	}: HTMLButtonAttributes & { children?: Snippet } = $props();
</script>

<Button
	class="h-14 w-full rounded-2xl px-5 text-base font-semibold shadow-lg shadow-primary/35 hover:shadow-xl hover:shadow-primary/45 disabled:shadow-none [&_svg]:size-5 {className}"
	{...rest}
>
	{@render children?.()}
</Button>
