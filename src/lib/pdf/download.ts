import { zipSync } from 'fflate';
import { safeDownloadName } from './format';
import type { OutputFile } from './types';

export function downloadBytes(data: Uint8Array, name: string, mime: string) {
	const copy = new Uint8Array(data.byteLength);
	copy.set(data);
	const blob = new Blob([copy], { type: mime });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = safeDownloadName(name);
	link.click();
	window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function downloadOutput(file: OutputFile) {
	downloadBytes(file.data, file.name, file.mime);
}

export function downloadAll(files: OutputFile[], archiveName: string) {
	if (files.length === 1) {
		downloadOutput(files[0]);
		return;
	}
	const archive: Record<string, Uint8Array> = {};
	for (const file of files) {
		const copy = new Uint8Array(file.data.byteLength);
		copy.set(file.data);
		archive[safeDownloadName(file.name)] = copy;
	}
	downloadBytes(zipSync(archive, { level: 0 }), archiveName, 'application/zip');
}
