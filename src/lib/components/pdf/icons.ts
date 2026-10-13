import Combine from '@lucide/svelte/icons/combine';
import FileImage from '@lucide/svelte/icons/file-image';
import FileMinus from '@lucide/svelte/icons/file-minus';
import Hash from '@lucide/svelte/icons/hash';
import ImagePlus from '@lucide/svelte/icons/image-plus';
import ListOrdered from '@lucide/svelte/icons/list-ordered';
import RotateCw from '@lucide/svelte/icons/rotate-cw';
import Scissors from '@lucide/svelte/icons/scissors';
import type { Component } from 'svelte';
import type { ToolId } from '$lib/pdf/types';

export const toolIcons: Record<ToolId, Component<{ class?: string }>> = {
	merge: Combine,
	split: Scissors,
	delete: FileMinus,
	rotate: RotateCw,
	organize: ListOrdered,
	'images-to-pdf': ImagePlus,
	'pdf-to-images': FileImage,
	'page-numbers': Hash
};
