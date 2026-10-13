import { describe, expect, it } from 'vitest';
import { fileFingerprint } from './fingerprint';
import { reorder } from './order';

describe('merge support', () => {
	it('reorders items and leaves an invalid move untouched', () => {
		const items = ['a', 'b', 'c', 'd'];
		expect(reorder(items, 0, 2)).toEqual(['b', 'c', 'a', 'd']);
		expect(reorder(items, 3, 1)).toEqual(['a', 'd', 'b', 'c']);
		expect(reorder(items, 1, 1)).toBe(items);
		expect(reorder(items, -1, 1)).toBe(items);
		expect(reorder(items, 0, 8)).toBe(items);
	});

	it('matches files with the same bytes and distinguishes different ones', async () => {
		const same = new Uint8Array([37, 80, 68, 70, 45, 1, 2, 9]);
		const other = new Uint8Array([37, 80, 68, 70, 45, 1, 2, 8]);
		const first = new File([same], 'a.pdf', { type: 'application/pdf' });
		const second = new File([same], 'b.pdf', { type: 'application/pdf' });
		const third = new File([other], 'c.pdf', { type: 'application/pdf' });
		const fingerprint = await fileFingerprint(first);
		expect(await fileFingerprint(second)).toBe(fingerprint);
		expect(await fileFingerprint(third)).not.toBe(fingerprint);
	});
});
