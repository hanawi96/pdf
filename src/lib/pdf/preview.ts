import { PdfError } from './errors';
import { loadPdfjs } from './render-pages';

type PdfProxy = Awaited<
	ReturnType<Awaited<ReturnType<typeof loadPdfjs>>['getDocument']>['promise']
>;

type Waiter = {
	resolve: (url: string) => void;
	reject: (error: unknown) => void;
};

export class PdfPreviewSession {
	private pdf: PdfProxy | null = null;
	private loadingTask: { destroy: () => Promise<void> } | null = null;
	private cache = new Map<number, string>();
	private queue: number[] = [];
	private waiters = new Map<number, Waiter[]>();
	private active = 0;
	private destroyed = false;
	private readonly concurrency = 2;
	private readonly maxCache = 40;

	async open(bytes: Uint8Array, password?: string) {
		this.destroy();
		this.destroyed = false;
		const pdfjs = await loadPdfjs();
		const task = pdfjs.getDocument({
			data: bytes.slice(),
			password
		});
		this.loadingTask = task;
		try {
			this.pdf = await task.promise;
			return this.pdf.numPages;
		} catch (error) {
			const name = error instanceof Error ? error.name : '';
			if (name === 'PasswordException') {
				throw new PdfError('Mật khẩu không đúng.', 'encrypted');
			}
			throw new PdfError('Không xem trước được PDF này.', 'invalid');
		}
	}

	get pageCount() {
		return this.pdf?.numPages ?? 0;
	}

	request(pageNumber: number, scale = 0.32) {
		const cached = this.cache.get(pageNumber);
		if (cached) {
			this.cache.delete(pageNumber);
			this.cache.set(pageNumber, cached);
			return Promise.resolve(cached);
		}
		return new Promise<string>((resolve, reject) => {
			const waiters = this.waiters.get(pageNumber) ?? [];
			waiters.push({ resolve, reject });
			this.waiters.set(pageNumber, waiters);
			if (!this.queue.includes(pageNumber)) this.queue.push(pageNumber);
			void scale;
			this.pump(scale);
		});
	}

	destroy() {
		this.destroyed = true;
		this.queue = [];
		for (const waiters of this.waiters.values()) {
			for (const waiter of waiters)
				waiter.reject(new PdfError('Đã đóng bản xem trước.', 'cancelled'));
		}
		this.waiters.clear();
		void this.loadingTask?.destroy();
		this.loadingTask = null;
		void this.pdf?.cleanup();
		this.pdf = null;
		for (const url of this.cache.values()) URL.revokeObjectURL(url);
		this.cache.clear();
		this.active = 0;
	}

	private pump(scale: number) {
		if (!this.pdf || this.destroyed) return;
		while (this.active < this.concurrency && this.queue.length > 0) {
			const pageNumber = this.queue.shift();
			if (!pageNumber) return;
			this.active += 1;
			void this.render(pageNumber, scale)
				.then((url) => {
					const waiters = this.waiters.get(pageNumber) ?? [];
					this.waiters.delete(pageNumber);
					for (const waiter of waiters) waiter.resolve(url);
				})
				.catch((error) => {
					const waiters = this.waiters.get(pageNumber) ?? [];
					this.waiters.delete(pageNumber);
					for (const waiter of waiters) waiter.reject(error);
				})
				.finally(() => {
					this.active -= 1;
					this.pump(scale);
				});
		}
	}

	private async render(pageNumber: number, scale: number) {
		if (!this.pdf || this.destroyed) {
			throw new PdfError('Bản xem trước đã được giải phóng.', 'cancelled');
		}
		const page = await this.pdf.getPage(pageNumber);
		try {
			const viewport = page.getViewport({ scale });
			const canvas = document.createElement('canvas');
			canvas.width = Math.ceil(viewport.width);
			canvas.height = Math.ceil(viewport.height);
			await page.render({ canvas, viewport }).promise;
			const blob = await new Promise<Blob | null>((resolve) => {
				canvas.toBlob((result) => resolve(result), 'image/jpeg', 0.72);
			});
			canvas.width = 0;
			canvas.height = 0;
			if (!blob || this.destroyed) {
				throw new PdfError('Không tạo được ảnh thu nhỏ.', 'invalid');
			}
			const url = URL.createObjectURL(blob);
			this.remember(pageNumber, url);
			return url;
		} finally {
			page.cleanup();
		}
	}

	take(pageNumber: number) {
		const url = this.cache.get(pageNumber) ?? null;
		if (url) this.cache.delete(pageNumber);
		return url;
	}

	async firstPageScale(maxEdge: number) {
		if (!this.pdf || this.destroyed) {
			throw new PdfError('Bản xem trước đã được giải phóng.', 'cancelled');
		}
		const page = await this.pdf.getPage(1);
		try {
			const viewport = page.getViewport({ scale: 1 });
			const longest = Math.max(viewport.width, viewport.height) || 1;
			return maxEdge / longest;
		} finally {
			page.cleanup();
		}
	}

	private remember(pageNumber: number, url: string) {
		this.cache.set(pageNumber, url);
		while (this.cache.size > this.maxCache) {
			const oldest = this.cache.keys().next().value;
			if (oldest === undefined) break;
			const removed = this.cache.get(oldest);
			this.cache.delete(oldest);
			if (removed) URL.revokeObjectURL(removed);
		}
	}
}

const coverSlots = { active: 0, waiters: [] as Array<() => void> };
const COVER_LIMIT = 2;

function acquireCover() {
	if (coverSlots.active < COVER_LIMIT) {
		coverSlots.active += 1;
		return Promise.resolve();
	}
	return new Promise<void>((resolve) => {
		coverSlots.waiters.push(() => {
			coverSlots.active += 1;
			resolve();
		});
	});
}

function releaseCover() {
	coverSlots.active = Math.max(0, coverSlots.active - 1);
	coverSlots.waiters.shift()?.();
}

export async function renderCover(
	bytes: Uint8Array,
	password?: string,
	options?: { maxEdge?: number; signal?: AbortSignal }
) {
	if (options?.signal?.aborted) return null;
	await acquireCover();
	const session = new PdfPreviewSession();
	let owned: string | null = null;
	try {
		if (options?.signal?.aborted) return null;
		await session.open(bytes, password);
		if (options?.signal?.aborted) return null;
		const scale = await session.firstPageScale(options?.maxEdge ?? 168);
		await session.request(1, scale);
		owned = session.take(1);
		if (!owned || options?.signal?.aborted) return null;
		const url = owned;
		owned = null;
		return url;
	} catch (error) {
		if (options?.signal?.aborted) return null;
		throw error;
	} finally {
		if (owned) URL.revokeObjectURL(owned);
		session.destroy();
		releaseCover();
	}
}

export async function countUnlockedPages(bytes: Uint8Array, password: string) {
	const pdfjs = await loadPdfjs();
	const task = pdfjs.getDocument({ data: bytes, password });
	try {
		const pdf = await task.promise;
		return pdf.numPages;
	} catch (error) {
		const name = error instanceof Error ? error.name : '';
		if (name === 'PasswordException') {
			throw new PdfError('Mật khẩu không đúng.', 'encrypted');
		}
		throw new PdfError('Không mở được PDF này.', 'invalid');
	} finally {
		await task.destroy();
	}
}
