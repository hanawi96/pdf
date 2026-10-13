import { PDFDocument, StandardFonts, EncryptedPDFError } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { mapLoadError } from './bytes';
import {
	addPageNumbers,
	deletePages,
	imagesToPdf,
	mergePdfs,
	organizePdf,
	rotatePdf,
	splitPdf
} from './engine';

const png = Uint8Array.from(
	Buffer.from(
		'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
		'base64'
	)
);

async function makePdf(labels: string[]) {
	const doc = await PDFDocument.create();
	const font = await doc.embedFont(StandardFonts.Helvetica);
	for (const label of labels) {
		const page = doc.addPage([220, 180]);
		page.drawText(label, { x: 24, y: 90, size: 18, font });
	}
	return doc.save();
}

async function pageCount(bytes: Uint8Array) {
	return (await PDFDocument.load(bytes)).getPageCount();
}

async function pageText(bytes: Uint8Array, pageNumber: number) {
	const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
	const task = pdfjs.getDocument({ data: bytes.slice() });
	const pdf = await task.promise;
	const page = await pdf.getPage(pageNumber);
	const content = await page.getTextContent();
	const text = content.items.map((item) => ('str' in item ? item.str : '')).join(' ');
	await task.destroy();
	return text;
}

describe('pdf engine', () => {
	it('merges documents in the requested order', async () => {
		const first = await makePdf(['A']);
		const second = await makePdf(['B']);
		const merged = await mergePdfs([first, second], ['a.pdf', 'b.pdf']);
		expect(await pageCount(merged.data)).toBe(2);
		expect(await pageText(merged.data, 1)).toContain('A');
		expect(await pageText(merged.data, 2)).toContain('B');
	});

	it('keeps every page in order and reports measured progress', async () => {
		const first = await makePdf(['A1', 'A2']);
		const second = await makePdf(['B1']);
		const marks: Array<number | null> = [];
		const messages: string[] = [];
		const merged = await mergePdfs(
			[first, second],
			['a.pdf', 'b.pdf'],
			undefined,
			(progress, message) => {
				marks.push(progress);
				messages.push(message);
			}
		);
		expect(await pageCount(merged.data)).toBe(3);
		expect(await pageText(merged.data, 1)).toContain('A1');
		expect(await pageText(merged.data, 2)).toContain('A2');
		expect(await pageText(merged.data, 3)).toContain('B1');
		const ratios = marks.filter((mark): mark is number => mark !== null);
		expect(ratios[0]).toBe(0);
		expect(ratios.at(-1)).toBe(100);
		for (let index = 1; index < ratios.length; index += 1) {
			expect(ratios[index]).toBeGreaterThanOrEqual(ratios[index - 1]);
		}
		expect(marks.indexOf(null)).toBeGreaterThan(-1);
		expect(marks.indexOf(null)).toBeLessThan(marks.lastIndexOf(100));
		expect(messages).toContain('Đã ghép 3 trang');
		expect(messages).toContain('Đang lưu PDF');
	});

	it('splits a range into separate files', async () => {
		const source = await makePdf(['P1', 'P2', 'P3']);
		const parts = await splitPdf(source, 'ho-so.pdf', 'ranges', '1-2, 3');
		expect(parts).toHaveLength(2);
		expect(await pageCount(parts[0].data)).toBe(2);
		expect(await pageCount(parts[1].data)).toBe(1);
		expect(await pageText(parts[1].data, 1)).toContain('P3');
	});

	it('deletes only the selected pages', async () => {
		const source = await makePdf(['P1', 'P2', 'P3']);
		const result = await deletePages(source, 'ho-so.pdf', [2]);
		expect(await pageCount(result.data)).toBe(2);
		expect(await pageText(result.data, 1)).toContain('P1');
		expect(await pageText(result.data, 2)).toContain('P3');
	});

	it('rotates a page by 90 degrees', async () => {
		const source = await makePdf(['P1']);
		const result = await rotatePdf(source, 'ho-so.pdf', { '1': 90 });
		const doc = await PDFDocument.load(result.data);
		expect(doc.getPage(0).getRotation().angle).toBe(90);
	});

	it('reorders pages', async () => {
		const source = await makePdf(['P1', 'P2', 'P3']);
		const result = await organizePdf(source, 'ho-so.pdf', [3, 1, 2]);
		expect(await pageText(result.data, 1)).toContain('P3');
		expect(await pageText(result.data, 2)).toContain('P1');
	});

	it('draws a page number without replacing the original text', async () => {
		const source = await makePdf(['Hop dong']);
		const result = await addPageNumbers(source, 'ho-so.pdf', {
			position: 'bc',
			start: 4,
			fontSize: 12,
			margin: 24,
			template: 'page-n',
			skipFirst: false,
			color: 'black'
		});
		const text = await pageText(result.data, 1);
		expect(text).toContain('Hop dong');
		expect(text).toContain('Trang 4');
	});

	it('builds a one-page PDF from a PNG and rejects other images', async () => {
		const result = await imagesToPdf(
			[{ data: png, mime: 'image/png', name: 'anh.png' }],
			'a4',
			'anh.png'
		);
		expect(await pageCount(result.data)).toBe(1);
		await expect(
			imagesToPdf(
				[{ data: Uint8Array.from([1, 2, 3]), mime: 'image/gif', name: 'a.gif' }],
				'fit',
				'a.gif'
			)
		).rejects.toThrow(/JPG hoặc PNG/);
	});

	it('maps encrypted documents to a clear error', () => {
		expect(mapLoadError(new EncryptedPDFError()).code).toBe('encrypted');
		expect(mapLoadError(new Error('bad')).code).toBe('invalid');
	});
});
