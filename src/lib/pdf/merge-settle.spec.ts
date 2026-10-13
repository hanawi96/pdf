import { describe, expect, it } from 'vitest';
import { mergeSettleDelay } from './merge-settle';

describe('merge progress settle', () => {
	it('keeps a fast merge on screen long enough to see the bar finish', () => {
		expect(mergeSettleDelay(40)).toBe(880);
		expect(mergeSettleDelay(200)).toBe(720);
	});

	it('only pauses briefly after a merge that already took time', () => {
		expect(mergeSettleDelay(2000)).toBe(380);
	});

	it('shortens the pause when motion is reduced', () => {
		expect(mergeSettleDelay(30, true)).toBe(420);
	});
});
