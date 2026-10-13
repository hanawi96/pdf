<script lang="ts">
	import type { ToolDefinition } from '$lib/content/tools';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Slider } from '$lib/components/ui/slider';
	import * as Tabs from '$lib/components/ui/tabs';
	import type { PageNumberPosition, PageNumberTemplate } from '$lib/pdf/types';

	let {
		tool,
		splitMode = $bindable('each'),
		ranges = $bindable(''),
		rangeError = '',
		pageSize = $bindable('a4'),
		imageFormat = $bindable('jpeg'),
		quality = $bindable(0.82),
		scale = $bindable('1.5'),
		position = $bindable('bc'),
		startNumber = $bindable(1),
		fontSize = $bindable(12),
		margin = $bindable(36),
		template = $bindable('n'),
		skipFirst = $bindable(false),
		numberColor = $bindable('black')
	}: {
		tool: ToolDefinition;
		splitMode?: 'each' | 'ranges';
		ranges?: string;
		rangeError?: string;
		pageSize?: 'a4' | 'fit';
		imageFormat?: 'jpeg' | 'png';
		quality?: number;
		scale?: string;
		position?: PageNumberPosition;
		startNumber?: number;
		fontSize?: number;
		margin?: number;
		template?: PageNumberTemplate;
		skipFirst?: boolean;
		numberColor?: 'black' | 'white';
	} = $props();

	const positions: { id: PageNumberPosition; label: string }[] = [
		{ id: 'tl', label: 'Trên trái' },
		{ id: 'tc', label: 'Trên giữa' },
		{ id: 'tr', label: 'Trên phải' },
		{ id: 'bl', label: 'Dưới trái' },
		{ id: 'bc', label: 'Dưới giữa' },
		{ id: 'br', label: 'Dưới phải' }
	];
</script>

<div class="space-y-4">
	{#if tool.id === 'split'}
		<Tabs.Root bind:value={splitMode}>
			<Tabs.List class="grid w-full grid-cols-2">
				<Tabs.Trigger value="each">Từng trang</Tabs.Trigger>
				<Tabs.Trigger value="ranges">Khoảng trang</Tabs.Trigger>
			</Tabs.List>
		</Tabs.Root>
		{#if splitMode === 'ranges'}
			<div class="space-y-2">
				<Label for="ranges">Khoảng trang</Label>
				<Input id="ranges" bind:value={ranges} placeholder="1-3, 5, 8-10" />
				{#if rangeError}
					<p class="text-destructive text-xs">{rangeError}</p>
				{:else}
					<p class="text-muted-foreground text-xs">Mỗi khoảng sẽ thành một file PDF.</p>
				{/if}
			</div>
		{/if}
	{:else if tool.id === 'images-to-pdf'}
		<div class="space-y-2">
			<Label>Khổ trang</Label>
			<Select.Root type="single" bind:value={pageSize}>
				<Select.Trigger class="w-full">
					{pageSize === 'a4' ? 'A4, căn giữa ảnh' : 'Vừa với kích thước ảnh'}
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="a4" label="A4, căn giữa ảnh" />
					<Select.Item value="fit" label="Vừa với kích thước ảnh" />
				</Select.Content>
			</Select.Root>
		</div>
	{:else if tool.id === 'pdf-to-images'}
		<div class="space-y-2">
			<Label>Định dạng</Label>
			<Select.Root type="single" bind:value={imageFormat}>
				<Select.Trigger class="w-full">
					{imageFormat === 'jpeg' ? 'JPG — dung lượng nhỏ' : 'PNG — nét hơn'}
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="jpeg" label="JPG — dung lượng nhỏ" />
					<Select.Item value="png" label="PNG — nét hơn" />
				</Select.Content>
			</Select.Root>
		</div>
		<div class="space-y-2">
			<Label>Độ nét</Label>
			<Select.Root type="single" bind:value={scale}>
				<Select.Trigger class="w-full">
					{scale === '1' ? 'Tiêu chuẩn' : scale === '2' ? 'Rất rõ' : 'Rõ'}
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="1" label="Tiêu chuẩn" />
					<Select.Item value="1.5" label="Rõ" />
					<Select.Item value="2" label="Rất rõ" />
				</Select.Content>
			</Select.Root>
		</div>
		{#if imageFormat === 'jpeg'}
			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<Label>Chất lượng JPG</Label>
					<span class="text-muted-foreground text-xs">{Math.round(quality * 100)}%</span>
				</div>
				<Slider type="single" bind:value={quality} min={0.5} max={0.95} step={0.05} />
			</div>
		{/if}
	{:else if tool.id === 'page-numbers'}
		<div class="space-y-2">
			<Label>Vị trí</Label>
			<div class="grid grid-cols-3 gap-2">
				{#each positions as item (item.id)}
					<Button
						type="button"
						size="sm"
						variant={position === item.id ? 'default' : 'outline'}
						aria-pressed={position === item.id}
						onclick={() => (position = item.id)}
					>
						{item.label}
					</Button>
				{/each}
			</div>
		</div>
		<div class="grid grid-cols-2 gap-3">
			<div class="space-y-2">
				<Label for="start-number">Số bắt đầu</Label>
				<Input id="start-number" type="number" min="0" bind:value={startNumber} />
			</div>
			<div class="space-y-2">
				<Label>Kiểu số</Label>
				<Select.Root type="single" bind:value={template}>
					<Select.Trigger class="w-full">
						{template === 'n-of-total' ? '1 / 10' : template === 'page-n' ? 'Trang 1' : '1'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="n" label="1" />
						<Select.Item value="n-of-total" label="1 / 10" />
						<Select.Item value="page-n" label="Trang 1" />
					</Select.Content>
				</Select.Root>
			</div>
		</div>
		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<Label>Cỡ chữ</Label>
				<span class="text-muted-foreground text-xs">{fontSize} pt</span>
			</div>
			<Slider type="single" bind:value={fontSize} min={9} max={24} step={1} />
		</div>
		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<Label>Lề</Label>
				<span class="text-muted-foreground text-xs">{margin} pt</span>
			</div>
			<Slider type="single" bind:value={margin} min={16} max={72} step={2} />
		</div>
		<div class="flex items-center gap-2">
			<Checkbox id="skip-first" bind:checked={skipFirst} />
			<Label for="skip-first">Bỏ qua trang đầu</Label>
		</div>
		<div class="space-y-2">
			<Label>Màu số</Label>
			<Select.Root type="single" bind:value={numberColor}>
				<Select.Trigger class="w-full">{numberColor === 'white' ? 'Trắng' : 'Đen'}</Select.Trigger>
				<Select.Content>
					<Select.Item value="black" label="Đen" />
					<Select.Item value="white" label="Trắng" />
				</Select.Content>
			</Select.Root>
		</div>
	{:else}
		<p class="text-muted-foreground text-sm leading-6">
			{#if tool.id === 'merge'}
				Sắp xếp file bên trái. Bản ghép giữ nội dung từng trang và tạo một PDF mới.
			{:else if tool.id === 'delete'}
				Chọn trang cần bỏ trên ảnh thu nhỏ. Các trang còn lại giữ nguyên thứ tự.
			{:else if tool.id === 'rotate'}
				Xoay từng trang hoặc dùng nút xoay tất cả. Mỗi lần bấm là 90 độ.
			{:else}
				Kéo trang để đổi chỗ. Mọi trang gốc vẫn được giữ trong file mới.
			{/if}
		</p>
	{/if}
</div>
