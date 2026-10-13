import { mapLoadError, startsWithPdf } from './bytes';
import { PdfError } from './errors';
import { mayHaveDigitalSignature } from './signature';
import type { Inspection } from './types';

export async function inspectPdf(bytes: Uint8Array): Promise<Inspection> {
	if (!startsWithPdf(bytes)) {
		throw new PdfError('Tệp không phải PDF hợp lệ.', 'invalid');
	}
	const signed = mayHaveDigitalSignature(bytes);
	try {
		const { PDFDocument } = await import('pdf-lib');
		const doc = await PDFDocument.load(bytes, { updateMetadata: false });
		return { pageCount: doc.getPageCount(), encrypted: false, signed };
	} catch (error) {
		const mapped = mapLoadError(error);
		if (mapped.code === 'encrypted') {
			return { pageCount: null, encrypted: true, signed };
		}
		throw mapped;
	}
}
