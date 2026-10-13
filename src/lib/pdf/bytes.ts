import { PdfError } from './errors';

export function startsWithPdf(bytes: Uint8Array) {
	const header = new TextDecoder().decode(bytes.subarray(0, Math.min(bytes.length, 8)));
	return header.startsWith('%PDF');
}

export function mapLoadError(error: unknown) {
	const name = error instanceof Error ? error.name : '';
	const message = error instanceof Error ? error.message : '';
	if (name === 'EncryptedPDFError' || message.toLowerCase().includes('encrypted')) {
		return new PdfError(
			'PDF này đang được bảo vệ bằng mật khẩu. Hãy nhập mật khẩu để tiếp tục.',
			'encrypted'
		);
	}
	return new PdfError('Không đọc được PDF. Tệp có thể bị hỏng hoặc không được hỗ trợ.', 'invalid');
}

export function imageKind(data: Uint8Array, mime = ''): 'jpeg' | 'png' | null {
	if (data.length > 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return 'jpeg';
	if (
		data.length > 8 &&
		data[0] === 0x89 &&
		data[1] === 0x50 &&
		data[2] === 0x4e &&
		data[3] === 0x47
	) {
		return 'png';
	}
	if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpeg';
	if (mime.includes('png')) return 'png';
	return null;
}
