import { executeJob } from './engine';
import { inspectPdf } from './inspect';
import { PdfError, isPdfError } from './errors';
import type { Job } from './types';

const controllers = new Map<string, AbortController>();
const scope = globalThis as unknown as {
	onmessage: ((event: MessageEvent) => void) | null;
	postMessage: (message: unknown, transfer?: Transferable[]) => void;
};

scope.onmessage = (event: MessageEvent) => {
	const data = event.data as { type?: string; id?: string; job?: Job; bytes?: Uint8Array };
	if (!data?.id) return;
	if (data.type === 'cancel') {
		controllers.get(data.id)?.abort();
		return;
	}
	if (data.type === 'inspect' && data.bytes) {
		void inspect(data.id, data.bytes);
		return;
	}
	if (data.type !== 'run' || !data.job) return;
	void run(data.id, data.job);
};

async function inspect(id: string, bytes: Uint8Array) {
	try {
		const inspection = await inspectPdf(bytes);
		scope.postMessage({ type: 'inspected', id, inspection });
	} catch (error) {
		const pdfError = isPdfError(error) ? error : new PdfError('Không đọc được PDF.', 'invalid');
		scope.postMessage({
			type: 'error',
			id,
			message: pdfError.message,
			code: pdfError.code
		});
	}
}

async function run(id: string, job: Job) {
	const controller = new AbortController();
	controllers.set(id, controller);
	try {
		const files = await executeJob(job, controller.signal, (progress, message) => {
			scope.postMessage({ type: 'progress', id, progress, message });
		});
		if (controller.signal.aborted) {
			scope.postMessage({
				type: 'error',
				id,
				message: 'Đã hủy tác vụ.',
				code: 'cancelled'
			});
			return;
		}
		const copies = files.map((file) => {
			const data = new Uint8Array(file.data.byteLength);
			data.set(file.data);
			return { name: file.name, mime: file.mime, data };
		});
		scope.postMessage(
			{ type: 'result', id, files: copies },
			copies.map((file) => file.data.buffer)
		);
	} catch (error) {
		const pdfError = isPdfError(error) ? error : new PdfError('Không xử lý được PDF.', 'invalid');
		scope.postMessage({
			type: 'error',
			id,
			message: pdfError.message,
			code: pdfError.code
		});
	} finally {
		controllers.delete(id);
	}
}
