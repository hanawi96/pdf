import type { ToolId } from './types';

export const CLIENT_BYTE_LIMIT = 40 * 1024 * 1024;
export const CLIENT_PAGE_LIMIT = 80;
export const SERVER_BYTE_LIMIT = 150 * 1024 * 1024;
export const SERVER_PAGE_LIMIT = 800;
export const MAX_FILES = 30;

const SERVER_TOOLS = new Set<ToolId>(['merge', 'split', 'delete', 'rotate', 'organize']);

export type RouteDecision =
	| { target: 'client'; reason: string }
	| { target: 'server'; reason: string }
	| { target: 'decrypt-then-client'; reason: string }
	| { target: 'blocked'; reason: string };

export type RouteInput = {
	tool: ToolId;
	totalBytes: number;
	pageCount: number;
	encrypted: boolean;
	deviceMemory?: number;
	hardwareConcurrency?: number;
};

function deviceCanHandle(input: RouteInput, byteLimit: number, pageLimit: number) {
	const memory = input.deviceMemory ?? 8;
	const cores = input.hardwareConcurrency ?? 8;
	if (input.totalBytes > byteLimit || input.pageCount > pageLimit) return false;
	if (memory <= 2 && (input.totalBytes > 12 * 1024 * 1024 || input.pageCount > 25)) return false;
	if (memory <= 4 && input.pageCount > 50) return false;
	if (cores <= 2 && input.pageCount > 40) return false;
	return true;
}

function clientLimits(tool: ToolId) {
	if (tool === 'pdf-to-images') {
		return { bytes: 25 * 1024 * 1024, pages: 40 };
	}
	if (tool === 'images-to-pdf') {
		return { bytes: 35 * 1024 * 1024, pages: 80 };
	}
	return { bytes: CLIENT_BYTE_LIMIT, pages: CLIENT_PAGE_LIMIT };
}

export function routeJob(input: RouteInput): RouteDecision {
	if (input.totalBytes <= 0 || input.pageCount < 0) {
		return { target: 'blocked', reason: 'Chưa có đủ dữ liệu để xử lý tệp.' };
	}

	if (input.totalBytes > SERVER_BYTE_LIMIT) {
		return {
			target: 'blocked',
			reason: 'Tệp vượt quá 150 MB. Hãy chia nhỏ tài liệu trước khi xử lý.'
		};
	}

	if (input.pageCount > SERVER_PAGE_LIMIT) {
		return {
			target: 'blocked',
			reason: `Tài liệu có hơn ${SERVER_PAGE_LIMIT} trang nên chưa được hỗ trợ.`
		};
	}

	const limits = clientLimits(input.tool);
	const local = deviceCanHandle(input, limits.bytes, limits.pages);

	if (input.encrypted && input.tool === 'pdf-to-images') {
		if (!local) {
			return {
				target: 'blocked',
				reason:
					'Bản PDF có mật khẩu này quá nặng để đổi sang ảnh trên thiết bị hiện tại. Hãy giảm số trang hoặc dùng máy mạnh hơn.'
			};
		}
		return {
			target: 'client',
			reason: 'PDF có mật khẩu được đổi sang ảnh ngay trên trình duyệt, không cần tải lên.'
		};
	}

	if (input.encrypted && input.tool === 'page-numbers') {
		return {
			target: 'decrypt-then-client',
			reason:
				'PDF đang khóa mật khẩu. Sổ cần gửi tệp tới máy chủ qpdf để mở khóa, sau đó đánh số trang trên chính trình duyệt của bạn. Tệp tạm sẽ bị xóa ngay khi xong.'
		};
	}

	if (input.encrypted && SERVER_TOOLS.has(input.tool)) {
		return {
			target: 'server',
			reason:
				'PDF có mật khẩu không sửa được hoàn toàn trong trình duyệt. Nếu bạn đồng ý, tệp sẽ được gửi tới máy chủ qpdf, xử lý bằng mật khẩu bạn nhập, rồi xóa khỏi đĩa tạm.'
		};
	}

	if (input.encrypted) {
		return {
			target: 'blocked',
			reason: 'Công cụ này chưa mở được PDF có mật khẩu.'
		};
	}

	if (!SERVER_TOOLS.has(input.tool)) {
		if (!local) {
			return {
				target: 'blocked',
				reason:
					'Thao tác này chỉ chạy trên trình duyệt và tệp đang nặng hơn khả năng thiết bị. Hãy giảm số trang, hạ độ phân giải hoặc chia nhỏ tệp.'
			};
		}
		return { target: 'client', reason: 'Xử lý ngay trên trình duyệt.' };
	}

	if (local) {
		return { target: 'client', reason: 'Xử lý ngay trên trình duyệt, không tải tệp lên.' };
	}

	return {
		target: 'server',
		reason:
			'Tệp hoặc thiết bị vượt ngưỡng xử lý an toàn trên trình duyệt. Nếu bạn đồng ý, Sổ sẽ gửi PDF tới máy chủ qpdf có giới hạn tài nguyên và tự xóa tệp tạm sau khi xong.'
	};
}
