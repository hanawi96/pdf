import { executeJob } from './engine';
import { inspectPdf } from './inspect';
import { PdfError, isPdfError } from './errors';
import type { Inspection, Job, OutputFile, ProgressFn } from './types';

type WorkerResponse =
	| { type: 'progress'; id: string; progress: number | null; message: string }
	| { type: 'result'; id: string; files: OutputFile[] }
	| { type: 'inspected'; id: string; inspection: Inspection }
	| { type: 'error'; id: string; message: string; code: PdfError['code'] };

let worker: Worker | null = null;
let sequence = 0;

function getWorker() {
	if (worker) return worker;
	worker = new Worker(new URL('./pdf.worker.ts', import.meta.url), { type: 'module' });
	return worker;
}

export async function runInWorker(
	job: Job,
	signal: AbortSignal,
	onProgress?: ProgressFn
): Promise<OutputFile[]> {
	if (typeof Worker === 'undefined') return executeJob(job, signal, onProgress);

	try {
		return await runOnce(job, signal, onProgress);
	} catch (error) {
		if (isPdfError(error) && error.code === 'unsupported' && job.tool === 'pdf-to-images') {
			onProgress?.(4, 'Đang xuất ảnh trên luồng chính');
			return executeJob(job, signal, onProgress);
		}
		throw error;
	}
}

function runOnce(job: Job, signal: AbortSignal, onProgress?: ProgressFn) {
	const id = `job-${++sequence}`;
	const current = getWorker();

	return new Promise<OutputFile[]>((resolve, reject) => {
		const fail = (error: PdfError) => {
			cleanup();
			reject(error);
		};
		const onMessage = (event: MessageEvent<WorkerResponse>) => {
			if (event.data?.id !== id) return;
			if (event.data.type === 'progress') {
				onProgress?.(event.data.progress, event.data.message);
				return;
			}
			cleanup();
			if (event.data.type === 'result') {
				resolve(event.data.files);
				return;
			}
			if (event.data.type === 'error') {
				reject(new PdfError(event.data.message, event.data.code));
			}
		};
		const onError = () => {
			worker?.terminate();
			worker = null;
			fail(new PdfError('Luồng xử lý đã dừng đột ngột.', 'invalid'));
		};
		const onAbort = () => {
			current.postMessage({ type: 'cancel', id });
			fail(new PdfError('Đã hủy tác vụ.', 'cancelled'));
		};

		function cleanup() {
			current.removeEventListener('message', onMessage);
			current.removeEventListener('error', onError);
			signal.removeEventListener('abort', onAbort);
		}

		if (signal.aborted) {
			reject(new PdfError('Đã hủy tác vụ.', 'cancelled'));
			return;
		}

		current.addEventListener('message', onMessage);
		current.addEventListener('error', onError);
		signal.addEventListener('abort', onAbort, { once: true });
		const transfers =
			job.tool === 'merge' ? job.files.map((file) => file.buffer as ArrayBuffer) : [];
		current.postMessage({ type: 'run', id, job }, transfers);
	});
}

export async function inspectFile(file: File): Promise<Inspection> {
	const bytes = new Uint8Array(await file.arrayBuffer());
	if (typeof Worker === 'undefined') return inspectPdf(bytes);
	try {
		return await inspectInWorker(bytes);
	} catch (error) {
		if (isPdfError(error) && error.message !== 'Luồng xử lý đã dừng đột ngột.') throw error;
		const again = bytes.byteLength > 0 ? bytes : new Uint8Array(await file.arrayBuffer());
		return inspectPdf(again);
	}
}

function inspectInWorker(bytes: Uint8Array) {
	const id = `inspect-${++sequence}`;
	const current = getWorker();
	return new Promise<Inspection>((resolve, reject) => {
		const finish = (error?: PdfError, inspection?: Inspection) => {
			current.removeEventListener('message', onMessage);
			current.removeEventListener('error', onError);
			if (error) reject(error);
			else resolve(inspection as Inspection);
		};
		const onMessage = (event: MessageEvent<WorkerResponse>) => {
			if (event.data?.id !== id) return;
			if (event.data.type === 'inspected') {
				finish(undefined, event.data.inspection);
				return;
			}
			if (event.data.type === 'error') {
				finish(new PdfError(event.data.message, event.data.code));
			}
		};
		const onError = () => {
			worker?.terminate();
			worker = null;
			finish(new PdfError('Luồng xử lý đã dừng đột ngột.', 'invalid'));
		};
		current.addEventListener('message', onMessage);
		current.addEventListener('error', onError);
		current.postMessage({ type: 'inspect', id, bytes }, [bytes.buffer as ArrayBuffer]);
	});
}
