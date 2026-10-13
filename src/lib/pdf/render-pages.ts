import { PdfError, throwIfAborted } from './errors';
import { fileStem } from './format';
import type { Job, OutputFile, ProgressFn } from './types';

type PdfjsModule = typeof import('pdfjs-dist');

let pdfjsPromise: Promise<PdfjsModule> | null = null;

export function loadPdfjs() {
	pdfjsPromise ??= import('pdfjs-dist').then((pdfjs) => {
		if (typeof window !== 'undefined') {
			pdfjs.GlobalWorkerOptions.workerSrc = new URL(
				'pdfjs-dist/build/pdf.worker.min.mjs',
				import.meta.url
			).toString();
		}
		return pdfjs;
	});
	return pdfjsPromise;
}

export async function renderPdfPages(
	job: Extract<Job, { tool: 'pdf-to-images' }>,
	signal?: AbortSignal,
	onProgress?: ProgressFn
): Promise<OutputFile[]> {
	if (job.pages.length === 0) {
		throw new PdfError('Hãy chọn ít nhất một trang để xuất ảnh.', 'empty');
	}
	const pdfjs = await loadPdfjs();
	const inWorker = typeof document === 'undefined';
	const task = pdfjs.getDocument({
		data: job.file.slice(),
		password: job.password
	});

	let pdf: Awaited<typeof task.promise> | null = null;
	try {
		pdf = await task.promise;
		const stem = fileStem(job.name);
		const files: OutputFile[] = [];
		const mime = job.format === 'png' ? 'image/png' : 'image/jpeg';
		const extension = job.format === 'png' ? 'png' : 'jpg';

		for (let index = 0; index < job.pages.length; index += 1) {
			throwIfAborted(signal);
			const pageNumber = job.pages[index];
			if (pageNumber < 1 || pageNumber > pdf.numPages) {
				throw new PdfError(`Không có trang ${pageNumber}.`, 'range');
			}
			onProgress?.(
				Math.round((index / job.pages.length) * 92),
				`Đang xuất trang ${index + 1}/${job.pages.length}`
			);
			const page = await pdf.getPage(pageNumber);
			try {
				const base = page.getViewport({ scale: 1 });
				const longest = Math.max(base.width, base.height);
				const scale = Math.min(job.scale, 3500 / longest);
				const viewport = page.getViewport({ scale: Math.max(0.4, scale) });
				const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
				const context = canvas.getContext('2d');
				if (!context) throw new PdfError('Trình duyệt không tạo được vùng vẽ ảnh.', 'unsupported');
				await page.render({
					canvas: canvas as unknown as HTMLCanvasElement,
					viewport
				}).promise;
				const blob = await canvasToBlob(canvas, mime, job.quality);
				files.push({
					name: `${stem}-trang-${pageNumber}.${extension}`,
					data: new Uint8Array(await blob.arrayBuffer()),
					mime
				});
			} finally {
				page.cleanup();
			}
		}
		onProgress?.(100, 'Đã xuất ảnh');
		return files;
	} catch (error) {
		if (error instanceof PdfError) throw error;
		const name = error instanceof Error ? error.name : '';
		if (name === 'PasswordException') {
			throw new PdfError('Mật khẩu không đúng.', 'encrypted');
		}
		if (inWorker && !(error instanceof PdfError)) {
			throw new PdfError('Không kết xuất được ảnh trong luồng nền.', 'unsupported');
		}
		throw new PdfError('Không xuất được ảnh từ PDF này.', 'invalid');
	} finally {
		await task.destroy();
	}
}

function createCanvas(width: number, height: number) {
	if (typeof document === 'undefined') {
		if (typeof OffscreenCanvas === 'undefined') {
			throw new PdfError('Thiết bị không hỗ trợ xuất ảnh trong nền.', 'unsupported');
		}
		return new OffscreenCanvas(width, height);
	}
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	return canvas;
}

async function canvasToBlob(
	canvas: HTMLCanvasElement | OffscreenCanvas,
	mime: string,
	quality: number
) {
	if ('convertToBlob' in canvas) {
		return canvas.convertToBlob({ type: mime, quality });
	}
	const blob = await new Promise<Blob | null>((resolve) => {
		canvas.toBlob((result) => resolve(result), mime, quality);
	});
	if (!blob) throw new PdfError('Không tạo được tệp ảnh.', 'invalid');
	return blob;
}
