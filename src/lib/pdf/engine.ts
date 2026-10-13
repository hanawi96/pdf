import { PDFDocument, StandardFonts, degrees, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { imageKind, mapLoadError, startsWithPdf } from './bytes';
import { PdfError, throwIfAborted } from './errors';
import { fileStem, safeDownloadName } from './format';
import { keepRange, parseRanges, rangesToPageNumbers } from './ranges';
import type {
	ImageInput,
	Job,
	OutputFile,
	PageNumberOptions,
	ProgressFn,
	QuarterTurn
} from './types';

const A4 = { width: 595.28, height: 841.89 };

async function loadDocument(bytes: Uint8Array) {
	if (bytes.byteLength < 5 || !startsWithPdf(bytes)) {
		throw new PdfError('Tệp không phải PDF hợp lệ.', 'invalid');
	}
	try {
		return await PDFDocument.load(bytes, { updateMetadata: false });
	} catch (error) {
		throw mapLoadError(error);
	}
}

async function save(doc: PDFDocument) {
	return doc.save({ useObjectStreams: true });
}

function output(name: string, data: Uint8Array, mime = 'application/pdf'): OutputFile {
	return { name: safeDownloadName(name), data, mime };
}

export async function mergePdfs(
	files: Uint8Array[],
	names: string[],
	signal?: AbortSignal,
	onProgress?: ProgressFn
) {
	if (files.length < 2) {
		throw new PdfError('Hãy chọn ít nhất hai tệp PDF để ghép.', 'empty');
	}
	const totalBytes = files.reduce((sum, file) => sum + file.byteLength, 0) || 1;
	const merged = await PDFDocument.create();
	let doneBytes = 0;
	let donePages = 0;
	for (let index = 0; index < files.length; index += 1) {
		throwIfAborted(signal);
		onProgress?.(
			Math.round((doneBytes / totalBytes) * 90),
			`Đang ghép tệp ${index + 1}/${files.length}`
		);
		const source = await loadDocument(files[index]);
		const indices = source.getPageIndices();
		const copied = await merged.copyPages(source, indices);
		for (const page of copied) merged.addPage(page);
		donePages += indices.length;
		doneBytes += files[index].byteLength;
		onProgress?.(Math.round((doneBytes / totalBytes) * 90), `Đã ghép ${donePages} trang`);
	}
	merged.setTitle(fileStem(names[0] ?? 'tai-lieu-da-ghep'));
	merged.setProducer('Sổ');
	merged.setCreator('Sổ');
	onProgress?.(null, 'Đang lưu PDF');
	const data = await save(merged);
	onProgress?.(100, 'Đã ghép xong');
	return output(`${fileStem(names[0] ?? 'tai-lieu')}-da-ghep.pdf`, data);
}

export async function splitPdf(
	bytes: Uint8Array,
	name: string,
	mode: 'each' | 'ranges',
	ranges: string,
	signal?: AbortSignal,
	onProgress?: ProgressFn
) {
	const source = await loadDocument(bytes);
	const pageCount = source.getPageCount();
	const groups =
		mode === 'each'
			? Array.from({ length: pageCount }, (_, index) => [index + 1])
			: groupRanges(parseRanges(ranges, pageCount));

	if (groups.length === 0) {
		throw new PdfError('Không có trang nào để tách.', 'empty');
	}

	const stem = fileStem(name);
	const files: OutputFile[] = [];
	for (let index = 0; index < groups.length; index += 1) {
		throwIfAborted(signal);
		onProgress?.(
			Math.round((index / groups.length) * 90),
			`Đang tách phần ${index + 1}/${groups.length}`
		);
		const pages = groups[index];
		const doc = await PDFDocument.create();
		const copied = await doc.copyPages(
			source,
			pages.map((page) => page - 1)
		);
		for (const page of copied) doc.addPage(page);
		const label = pages.length === 1 ? `trang-${pages[0]}` : `trang-${pages[0]}-${pages.at(-1)}`;
		files.push(output(`${stem}-${label}.pdf`, await save(doc)));
	}
	onProgress?.(100, 'Đã tách xong');
	return files;
}

function groupRanges(ranges: { start: number; end: number }[]) {
	return ranges.map((range) => rangesToPageNumbers([range]));
}

export async function deletePages(
	bytes: Uint8Array,
	name: string,
	pages: number[],
	signal?: AbortSignal,
	onProgress?: ProgressFn
) {
	const doc = await loadDocument(bytes);
	const unique = [...new Set(pages)].sort((a, b) => a - b);
	if (unique.length === 0) {
		throw new PdfError('Hãy chọn ít nhất một trang cần xóa.', 'empty');
	}
	keepRange(doc.getPageCount(), unique);
	onProgress?.(30, 'Đang xóa trang đã chọn');
	throwIfAborted(signal);
	for (const page of [...unique].sort((a, b) => b - a)) {
		doc.removePage(page - 1);
	}
	onProgress?.(92, 'Đang lưu PDF');
	return output(`${fileStem(name)}-da-xoa-trang.pdf`, await save(doc));
}

export async function rotatePdf(
	bytes: Uint8Array,
	name: string,
	rotations: Record<string, QuarterTurn>,
	signal?: AbortSignal,
	onProgress?: ProgressFn
) {
	const doc = await loadDocument(bytes);
	const entries = Object.entries(rotations).filter(([, angle]) => angle !== 0);
	if (entries.length === 0) {
		throw new PdfError('Hãy xoay ít nhất một trang.', 'empty');
	}
	onProgress?.(25, 'Đang xoay trang');
	entries.forEach(([pageNumber, angle], index) => {
		throwIfAborted(signal);
		const pageIndex = Number(pageNumber) - 1;
		if (pageIndex < 0 || pageIndex >= doc.getPageCount()) {
			throw new PdfError(`Không có trang ${pageNumber}.`, 'range');
		}
		const page = doc.getPage(pageIndex);
		const next = (normalizeAngle(page.getRotation().angle) + angle) % 360;
		page.setRotation(degrees(next));
		onProgress?.(
			25 + Math.round(((index + 1) / entries.length) * 60),
			`Đã xoay ${index + 1}/${entries.length} trang`
		);
	});
	onProgress?.(94, 'Đang lưu PDF');
	return output(`${fileStem(name)}-da-xoay.pdf`, await save(doc));
}

export async function organizePdf(
	bytes: Uint8Array,
	name: string,
	order: number[],
	signal?: AbortSignal,
	onProgress?: ProgressFn
) {
	const source = await loadDocument(bytes);
	const pageCount = source.getPageCount();
	if (order.length !== pageCount || new Set(order).size !== pageCount) {
		throw new PdfError('Thứ tự trang phải gồm đủ mọi trang, mỗi trang một lần.', 'range');
	}
	for (const page of order) {
		if (!Number.isInteger(page) || page < 1 || page > pageCount) {
			throw new PdfError('Thứ tự trang không hợp lệ.', 'range');
		}
	}
	throwIfAborted(signal);
	onProgress?.(20, 'Đang sắp xếp trang');
	const doc = await PDFDocument.create();
	const copied = await doc.copyPages(
		source,
		order.map((page) => page - 1)
	);
	for (const page of copied) doc.addPage(page);
	onProgress?.(94, 'Đang lưu PDF');
	return output(`${fileStem(name)}-da-sap-xep.pdf`, await save(doc));
}

export async function imagesToPdf(
	images: ImageInput[],
	pageSize: 'a4' | 'fit',
	name: string,
	signal?: AbortSignal,
	onProgress?: ProgressFn
) {
	if (images.length === 0) {
		throw new PdfError('Hãy chọn ít nhất một ảnh JPG hoặc PNG.', 'empty');
	}
	const doc = await PDFDocument.create();
	for (let index = 0; index < images.length; index += 1) {
		throwIfAborted(signal);
		onProgress?.(
			Math.round((index / images.length) * 88),
			`Đang thêm ảnh ${index + 1}/${images.length}`
		);
		const image = images[index];
		const embedded = await embedImage(doc, image);
		const box =
			pageSize === 'a4'
				? contain(embedded.width, embedded.height, A4.width - 72, A4.height - 72)
				: fitPage(embedded.width, embedded.height);
		const page =
			pageSize === 'a4' ? doc.addPage([A4.width, A4.height]) : doc.addPage([box.width, box.height]);
		const x = pageSize === 'a4' ? (A4.width - box.width) / 2 : 0;
		const y = pageSize === 'a4' ? (A4.height - box.height) / 2 : 0;
		page.drawImage(embedded, { x, y, width: box.width, height: box.height });
	}
	doc.setTitle(fileStem(name));
	doc.setProducer('Sổ');
	doc.setCreator('Sổ');
	onProgress?.(96, 'Đang lưu PDF');
	return output(`${fileStem(name)}.pdf`, await save(doc));
}

async function embedImage(doc: PDFDocument, image: ImageInput) {
	const kind = imageKind(image.data, image.mime);
	if (kind === 'jpeg') return doc.embedJpg(image.data);
	if (kind === 'png') return doc.embedPng(image.data);
	throw new PdfError(`Ảnh ${image.name} không được hỗ trợ. Chỉ dùng JPG hoặc PNG.`, 'unsupported');
}

function fitPage(width: number, height: number) {
	const maxEdge = 1440;
	const scale = Math.min(1, maxEdge / Math.max(width, height));
	return { width: Math.max(1, width * scale), height: Math.max(1, height * scale) };
}

function contain(width: number, height: number, boxWidth: number, boxHeight: number) {
	const scale = Math.min(boxWidth / width, boxHeight / height);
	return { width: width * scale, height: height * scale };
}

export async function addPageNumbers(
	bytes: Uint8Array,
	name: string,
	options: PageNumberOptions,
	signal?: AbortSignal,
	onProgress?: ProgressFn
) {
	const doc = await loadDocument(bytes);
	const font = await doc.embedFont(StandardFonts.Helvetica);
	const total = doc.getPageCount();
	const ink = options.color === 'white' ? rgb(1, 1, 1) : rgb(0.12, 0.14, 0.18);
	let printed = 0;
	for (let index = 0; index < total; index += 1) {
		throwIfAborted(signal);
		if (options.skipFirst && index === 0) continue;
		const label = formatPageNumber(options.start + printed, total, options.template);
		drawPageNumber(doc.getPage(index), font, label, options, ink);
		printed += 1;
		onProgress?.(
			Math.round(((index + 1) / total) * 90),
			`Đang đánh số trang ${index + 1}/${total}`
		);
	}
	if (printed === 0) {
		throw new PdfError('Không có trang nào được đánh số.', 'empty');
	}
	onProgress?.(96, 'Đang lưu PDF');
	return output(`${fileStem(name)}-danh-so-trang.pdf`, await save(doc));
}

function formatPageNumber(current: number, total: number, template: PageNumberOptions['template']) {
	if (template === 'n-of-total') return `${current} / ${total}`;
	if (template === 'page-n') return `Trang ${current}`;
	return String(current);
}

function drawPageNumber(
	page: PDFPage,
	font: PDFFont,
	text: string,
	options: PageNumberOptions,
	color: ReturnType<typeof rgb>
) {
	const { width, height } = page.getSize();
	const size = clamp(options.fontSize, 8, 36);
	const margin = clamp(options.margin, 12, 96);
	const textWidth = font.widthOfTextAtSize(text, size);
	let x = margin;
	let y = margin;
	if (options.position.endsWith('c')) x = (width - textWidth) / 2;
	if (options.position.endsWith('r')) x = width - textWidth - margin;
	if (options.position.startsWith('t')) y = height - margin - size;
	page.drawText(text, { x, y, size, font, color });
}

function clamp(value: number, min: number, max: number) {
	if (!Number.isFinite(value)) return min;
	return Math.min(max, Math.max(min, value));
}

function normalizeAngle(angle: number): QuarterTurn {
	const next = ((Math.round(angle) % 360) + 360) % 360;
	if (next === 90 || next === 180 || next === 270) return next;
	return 0;
}

export async function executeJob(
	job: Job,
	signal?: AbortSignal,
	onProgress?: ProgressFn
): Promise<OutputFile[]> {
	switch (job.tool) {
		case 'merge':
			return [await mergePdfs(job.files, job.names, signal, onProgress)];
		case 'split':
			return splitPdf(job.file, job.name, job.mode, job.ranges, signal, onProgress);
		case 'delete':
			return [await deletePages(job.file, job.name, job.pages, signal, onProgress)];
		case 'rotate':
			return [await rotatePdf(job.file, job.name, job.rotations, signal, onProgress)];
		case 'organize':
			return [await organizePdf(job.file, job.name, job.order, signal, onProgress)];
		case 'images-to-pdf':
			return [await imagesToPdf(job.images, job.pageSize, job.name, signal, onProgress)];
		case 'page-numbers':
			return [await addPageNumbers(job.file, job.name, job.options, signal, onProgress)];
		case 'pdf-to-images': {
			const { renderPdfPages } = await import('./render-pages');
			return renderPdfPages(job, signal, onProgress);
		}
		default:
			throw new PdfError('Công cụ chưa được hỗ trợ.', 'unsupported');
	}
}
