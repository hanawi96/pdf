import { describe, expect, it } from 'vitest';
import { mayHaveDigitalSignature } from './signature';

describe('signature warning', () => {
	it('flags a document that contains a byte range and signature', () => {
		const bytes = new TextEncoder().encode('%PDF-1.7 /Type /Sig /ByteRange [0 0 0 0]');
		expect(mayHaveDigitalSignature(bytes)).toBe(true);
	});

	it('does not flag a plain document', () => {
		const bytes = new TextEncoder().encode('%PDF-1.7 hello');
		expect(mayHaveDigitalSignature(bytes)).toBe(false);
	});
});
