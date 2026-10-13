import { describe, expect, it } from 'vitest';
import { compressPageNumbers, keepRange, parseRanges } from './ranges';

describe('page ranges', () => {
	it('parses lists and inclusive ranges', () => {
		expect(parseRanges('1-3, 5, 8-10', 12)).toEqual([
			{ start: 1, end: 3 },
			{ start: 5, end: 5 },
			{ start: 8, end: 10 }
		]);
	});

	it('rejects pages outside the document and unsafe tokens', () => {
		expect(() => parseRanges('1-9', 4)).toThrow(/ngoài tài liệu/);
		expect(() => parseRanges('1;2', 4)).toThrow(/không hợp lệ/);
	});

	it('compresses kept pages after a deletion', () => {
		expect(compressPageNumbers(keepRange(6, [2, 5]))).toBe('1,3-4,6');
		expect(() => keepRange(2, [1, 2])).toThrow(/toàn bộ trang/);
	});
});
