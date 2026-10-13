import { json } from '@sveltejs/kit';
import { QPDF_INTERNAL_URL } from '$app/env/private';
import type { RequestHandler } from './$types';

const ALLOWED = new Set(['merge', 'split', 'delete', 'rotate', 'organize', 'decrypt']);
const MAX_BYTES = 150 * 1024 * 1024;

export const POST: RequestHandler = async ({ request }) => {
	const incoming = await request.formData();
	const operation = incoming.get('operation');
	if (typeof operation !== 'string' || !ALLOWED.has(operation)) {
		return json({ message: 'Thao tác không hợp lệ.' }, { status: 400 });
	}

	const files = incoming.getAll('files').filter((value): value is File => value instanceof File);
	if (files.length === 0) return json({ message: 'Thiếu tệp PDF.' }, { status: 400 });

	let total = 0;
	for (const file of files) {
		const name = file.name.toLowerCase();
		if (!name.endsWith('.pdf') || file.size > MAX_BYTES) {
			return json({ message: 'Chỉ nhận PDF và mỗi tệp không quá 150 MB.' }, { status: 400 });
		}
		total += file.size;
	}
	if (total > MAX_BYTES) {
		return json({ message: 'Tổng dung lượng vượt quá 150 MB.' }, { status: 413 });
	}

	const endpoint = QPDF_INTERNAL_URL;
	try {
		const response = await fetch(`${endpoint}/process`, {
			method: 'POST',
			body: incoming,
			signal: request.signal
		});
		if (!response.ok) {
			const payload = (await response.json().catch(() => null)) as { message?: string } | null;
			return json(
				{ message: payload?.message || 'Máy chủ không xử lý được tệp.' },
				{ status: response.status }
			);
		}
		const bytes = await response.arrayBuffer();
		return new Response(bytes, {
			headers: {
				'content-type': response.headers.get('content-type') ?? 'application/pdf',
				'content-disposition':
					response.headers.get('content-disposition') ?? 'attachment; filename="so.pdf"',
				'cache-control': 'no-store'
			}
		});
	} catch {
		return json(
			{
				message:
					'Máy chủ qpdf chưa chạy. Hãy khởi động Docker backend, hoặc dùng tệp nhỏ hơn để xử lý trên trình duyệt.'
			},
			{ status: 503 }
		);
	}
};
