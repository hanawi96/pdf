<script lang="ts">
	import Menu from '@lucide/svelte/icons/menu';
	import { page } from '$app/state';
	import { tools } from '$lib/content/tools';
	import { siteName } from '$lib/content/site';
	import { toolIcons } from '$lib/components/pdf/icons';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Sheet from '$lib/components/ui/sheet';
	import Logo from './Logo.svelte';
	import ThemeToggle from './ThemeToggle.svelte';

	let menuOpen = $state(false);
	const pathname = $derived(page.url.pathname);

	$effect(() => {
		pathname;
		menuOpen = false;
	});
</script>

<header class="bg-background/85 sticky top-0 z-40 border-b backdrop-blur-md">
	<div class="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
		<a href="/" class="flex items-center gap-2 font-semibold tracking-tight">
			<Logo />
			<span>{siteName}</span>
		</a>

		<nav class="ml-6 hidden items-center gap-1 md:flex" aria-label="Chính">
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
						<Button variant="ghost" {...props}>Công cụ</Button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content class="w-64" align="start">
					{#each tools as tool (tool.id)}
						{@const Icon = toolIcons[tool.id]}
						<DropdownMenu.Item>
							{#snippet child({ props })}
								<a href="/{tool.slug}" {...props}>
									<Icon class="size-4" />
									{tool.nav}
								</a>
							{/snippet}
						</DropdownMenu.Item>
					{/each}
				</DropdownMenu.Content>
			</DropdownMenu.Root>
			<Button href="/gioi-thieu" variant="ghost">Giới thiệu</Button>
		</nav>

		<div class="ml-auto flex items-center gap-2">
			<ThemeToggle />
			<Sheet.Root bind:open={menuOpen}>
				<Sheet.Trigger>
					{#snippet child({ props })}
						<Button variant="outline" size="icon" class="md:hidden" aria-label="Mở menu" {...props}>
							<Menu />
						</Button>
					{/snippet}
				</Sheet.Trigger>
				<Sheet.Content side="right" class="w-[min(100%,20rem)]">
					<Sheet.Header>
						<Sheet.Title>Công cụ PDF</Sheet.Title>
						<Sheet.Description>Chọn một việc cần làm với tài liệu.</Sheet.Description>
					</Sheet.Header>
					<nav class="flex flex-col gap-1 px-4" aria-label="Di động">
						{#each tools as tool (tool.id)}
							{@const Icon = toolIcons[tool.id]}
							<a
								href="/{tool.slug}"
								class="hover:bg-muted flex items-center gap-2 rounded-lg px-2 py-2 text-sm {pathname ===
								`/${tool.slug}`
									? 'bg-muted font-medium'
									: ''}"
								aria-current={pathname === `/${tool.slug}` ? 'page' : undefined}
							>
								<Icon class="size-4" />
								{tool.nav}
							</a>
						{/each}
						<a class="hover:bg-muted mt-2 rounded-lg px-2 py-2 text-sm" href="/gioi-thieu">Giới thiệu</a>
					</nav>
				</Sheet.Content>
			</Sheet.Root>
		</div>
	</div>
</header>
