<script lang="ts">
	import ToolScreen from '$lib/components/pdf/ToolScreen.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<ToolScreen tool={data.tool} />
