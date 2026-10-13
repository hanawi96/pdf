<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Progress } from '$lib/components/ui/progress';

	let {
		progress = null,
		message = 'Đang xử lý',
		oncancel
	}: {
		progress?: number | null;
		message?: string;
		oncancel?: () => void;
	} = $props();
</script>

<div class="space-y-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10" aria-live="polite">
	<div class="flex items-center justify-between gap-3">
		<p class="text-sm font-medium">{message}</p>
		{#if progress !== null}
			<p class="text-sm text-muted-foreground tabular-nums">{Math.round(progress)}%</p>
		{/if}
	</div>
	{#if progress === null}
		<div
			class="relative h-1.5 overflow-hidden rounded-full bg-muted"
			role="progressbar"
			aria-valuetext={message}
		>
			<div class="indeterminate absolute inset-y-0 left-0 w-1/3 rounded-full bg-primary"></div>
		</div>
	{:else}
		<Progress value={progress} max={100} />
	{/if}
	<Button variant="outline" type="button" onclick={oncancel}>Hủy tác vụ</Button>
</div>

<style>
	.indeterminate {
		animation: so-progress 1.1s ease-in-out infinite;
	}

	@keyframes so-progress {
		0% {
			transform: translateX(-120%);
		}
		100% {
			transform: translateX(420%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.indeterminate {
			animation: none;
			width: 100%;
			opacity: 0.7;
		}
	}
</style>
