<script lang="ts">
	import Moon from '@lucide/svelte/icons/moon';
	import Sun from '@lucide/svelte/icons/sun';
	import { mode, toggleMode } from 'mode-watcher';
	import { Button } from '$lib/components/ui/button';

	const dark = $derived(mode.current === 'dark');
</script>

<Button
	variant="outline"
	size="icon"
	onclick={toggleMode}
	aria-label={dark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
>
	{#if dark}
		<Sun />
	{:else}
		<Moon />
	{/if}
</Button>
