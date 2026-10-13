<script lang="ts">
	let { class: className = 'size-8' }: { class?: string } = $props();
</script>

<span
	class="bg-primary text-primary-foreground inline-flex items-center justify-center rounded-lg {className}"
	aria-hidden="true"
>
	<svg viewBox="0 0 32 32" class="size-[62%] fill-none" fill="none">
		<path
			d="M8 7.5h10.2L23 12.4V24a1.5 1.5 0 0 1-1.5 1.5h-12A1.5 1.5 0 0 1 8 24V7.5Z"
			fill="currentColor"
		/>
		<path d="M18.1 7.6V12.2H22.7" stroke="var(--primary)" stroke-width="1.6" />
		<path
			d="M11.5 17.2h8.2M11.5 20.4h5.4"
			stroke="var(--primary)"
			stroke-width="1.6"
			stroke-linecap="round"
		/>
	</svg>
</span>
