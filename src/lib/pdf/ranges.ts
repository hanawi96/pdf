import { PdfError } from './errors';

export type PageRange = { start: number; end: number };

export function parseRanges(input: string, pageCount: number): PageRange[] {
	const cleaned = input.trim();
	if (!cleaned) {
		throw new PdfError('Hãy nhập khoảng trang, ví dụ 1-3, 5.', 'range');
	}

	const ranges: PageRange[] = [];
	for (const part of cleaned.split(',')) {
		const token = part.trim();
		if (!token) continue;
		const match = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(token);
		if (!match) {
			throw new PdfError(`Khoảng trang không hợp lệ: ${token}.`, 'range');
		}
		const start = Number(match[1]);
		const end = match[2] ? Number(match[2]) : start;
		if (start < 1 || end < start || end > pageCount) {
			throw new PdfError(`Trang ${token} nằm ngoài tài liệu (${pageCount} trang).`, 'range');
		}
		ranges.push({ start, end });
	}

	if (ranges.length === 0) {
		throw new PdfError('Hãy nhập ít nhất một trang.', 'range');
	}
	return ranges;
}

export function rangesToPageNumbers(ranges: PageRange[]): number[] {
	const pages: number[] = [];
	for (const range of ranges) {
		for (let page = range.start; page <= range.end; page += 1) pages.push(page);
	}
	return pages;
}

export function compressPageNumbers(pages: number[]): string {
	const unique = [...new Set(pages)].filter((page) => page >= 1).sort((a, b) => a - b);
	if (unique.length === 0) return '';
	const parts: string[] = [];
	let start = unique[0];
	let previous = unique[0];
	for (let index = 1; index <= unique.length; index += 1) {
		const current = unique[index];
		if (current === previous + 1) {
			previous = current;
			continue;
		}
		parts.push(start === previous ? `${start}` : `${start}-${previous}`);
		start = current;
		previous = current;
	}
	return parts.join(',');
}

export function keepRange(pageCount: number, remove: number[]): number[] {
	const removed = new Set(remove);
	const kept: number[] = [];
	for (let page = 1; page <= pageCount; page += 1) {
		if (!removed.has(page)) kept.push(page);
	}
	if (kept.length === 0) {
		throw new PdfError('Không thể xóa toàn bộ trang của tài liệu.', 'range');
	}
	return kept;
}
