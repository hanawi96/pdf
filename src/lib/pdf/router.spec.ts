import { describe, expect, it } from 'vitest';
import { routeJob } from './router';

describe('processing router', () => {
	it('keeps a small merge on the client', () => {
		expect(
			routeJob({
				tool: 'merge',
				totalBytes: 2 * 1024 * 1024,
				pageCount: 8,
				encrypted: false,
				deviceMemory: 8,
				hardwareConcurrency: 8
			}).target
		).toBe('client');
	});

	it('asks for the server when a qpdf task is too heavy', () => {
		expect(
			routeJob({
				tool: 'split',
				totalBytes: 70 * 1024 * 1024,
				pageCount: 20,
				encrypted: false,
				deviceMemory: 8,
				hardwareConcurrency: 8
			}).target
		).toBe('server');
	});

	it('blocks an image export that cannot leave the browser', () => {
		expect(
			routeJob({
				tool: 'pdf-to-images',
				totalBytes: 80 * 1024 * 1024,
				pageCount: 90,
				encrypted: false
			}).target
		).toBe('blocked');
	});

	it('sends a locked PDF to qpdf and keeps image export local', () => {
		expect(
			routeJob({
				tool: 'rotate',
				totalBytes: 1024,
				pageCount: 2,
				encrypted: true
			}).target
		).toBe('server');
		expect(
			routeJob({
				tool: 'pdf-to-images',
				totalBytes: 1024,
				pageCount: 2,
				encrypted: true,
				deviceMemory: 8,
				hardwareConcurrency: 8
			}).target
		).toBe('client');
		expect(
			routeJob({
				tool: 'page-numbers',
				totalBytes: 1024,
				pageCount: 2,
				encrypted: true
			}).target
		).toBe('decrypt-then-client');
	});
});
