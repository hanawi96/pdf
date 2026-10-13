import { unzipSync } from 'fflate';
import { PdfError } from './errors';
import type { OutputFile, ProgressFn } from './types';

export type ServerOperation = 'merge' | 'split' | 'delete' | 'rotate' | 'organize' | 'decrypt';

export async function runOnServer(input: {
	operation: ServerOperation;
	files: File[];
	passwords: string[];
	options: Record<string, unknown>;
	signal?: AbortSignal;
	onProgress?: ProgressFn;
}): Promise<OutputFile[]> {
	const form = new FormData();
	form.set('operation', input.operation);
	form.set('options', JSON.stringify(input.options));
	form.set('passwords', JSON.stringify(input.passwords));
	for (const file of input.files) form.append('files', file, file.name);

	input.onProgress?.(null, 'Đang tải tệp lên máy chủ');
	const response = await fetch('/api/qpdf', {
		method: 'POST',
		body: form,
		signal: input.signal
	});

	if (!response.ok) {
		const payload = (await response.json().catch(() => null)) as { message?: string } | null;
		throw new PdfError(
			payload?.message || 'Máy chủ không xử lý được tệp.',
			response.status === 413 ? 'too-large' : 'server'
		);
	}

	input.onProgress?.(null, 'Đang nhận kết quả');
	const bytes = new Uint8Array(await response.arrayBuffer());
	const type = response.headers.get('content-type') ?? 'application/pdf';
	if (type.includes('zip')) {
		const entries = unzipSync(bytes);
		return Object.entries(entries)
			.sort(([left], [right]) => left.localeCompare(right, undefined, { numeric: true }))
			.map(([name, data]) => ({ name, data, mime: 'application/pdf' }));
	}

	const disposition = response.headers.get('content-disposition') ?? '';
	const matched = /filename\*=UTF-8''([^;]+)|filename="([^"]+)"/.exec(disposition);
	const name = decodeURIComponent(matched?.[1] || matched?.[2] || 'so.pdf');
	return [{ name, data: bytes, mime: 'application/pdf' }];
}
