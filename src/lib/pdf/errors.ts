export type PdfErrorCode =
	| 'encrypted'
	| 'invalid'
	| 'empty'
	| 'range'
	| 'cancelled'
	| 'too-large'
	| 'unsupported'
	| 'server';

export class PdfError extends Error {
	readonly code: PdfErrorCode;

	constructor(message: string, code: PdfErrorCode) {
		super(message);
		this.name = 'PdfError';
		this.code = code;
	}
}

export function isPdfError(error: unknown): error is PdfError {
	return error instanceof PdfError;
}

export function throwIfAborted(signal?: AbortSignal) {
	if (signal?.aborted) {
		throw new PdfError('Đã hủy tác vụ.', 'cancelled');
	}
}

export function errorMessage(error: unknown, fallback = 'Không xử lý được tệp.') {
	if (error instanceof PdfError) return error.message;
	if (error instanceof Error && error.message) return error.message;
	return fallback;
}
