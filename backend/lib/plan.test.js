import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPlan, compressPages, isPdf, keepExpression, parseServerRanges } from './plan.js';

test('compresses page numbers into qpdf ranges', () => {
	assert.equal(compressPages([1, 2, 3, 5, 8, 9]), '1-3,5,8-9');
});

test('keeps every page except the ones removed', () => {
	assert.equal(keepExpression(6, [2, 5]), '1,3-4,6');
	assert.throws(() => keepExpression(2, [1, 2]));
});

test('rejects a range outside the document', () => {
	assert.deepEqual(parseServerRanges('1-2, 4', 4), ['1-2', '4']);
	assert.throws(() => parseServerRanges('1-9', 4));
	assert.throws(() => parseServerRanges('1;rm', 4));
});

test('builds merge, rotate and organize arguments without user paths', () => {
	const merge = buildPlan({
		operation: 'merge',
		pageCounts: [1, 1],
		inputPaths: ['a.pdf', 'b.pdf'],
		outputPath: 'out.pdf'
	});
	assert.deepEqual(merge[0].args, ['--empty', '--pages', 'a.pdf', '1-z', 'b.pdf', '1-z', '--', 'out.pdf']);

	const rotate = buildPlan({
		operation: 'rotate',
		options: { rotations: { 1: 90, 2: 90, 3: 180 } },
		pageCounts: [3],
		inputPaths: ['in.pdf'],
		outputPath: 'out.pdf'
	});
	assert.equal(rotate[0].args[0], 'in.pdf');
	assert.ok(rotate[0].args.includes('--rotate=+90:1-2'));
	assert.ok(rotate[0].args.includes('--rotate=+180:3'));

	const organize = buildPlan({
		operation: 'organize',
		options: { order: [3, 1, 2] },
		pageCounts: [3],
		inputPaths: ['in.pdf'],
		outputPath: 'out.pdf'
	});
	assert.deepEqual(organize[0].args, ['in.pdf', '--pages', '.', '3,1,2', '--', 'out.pdf']);
});

test('checks the PDF header', () => {
	assert.equal(isPdf(Buffer.from('%PDF-1.7')), true);
	assert.equal(isPdf(Buffer.from('not a pdf')), false);
});
