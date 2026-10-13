export function compressPages(pages) {
	const unique = [...new Set(pages)]
		.filter((page) => Number.isInteger(page) && page >= 1)
		.sort((left, right) => left - right);
	if (unique.length === 0) return '';

	const parts = [];
	let start = unique[0];
	let previous = unique[0];
	for (let index = 1; index <= unique.length; index += 1) {
		const current = unique[index];
		if (current === previous + 1) {
			previous = current;
			continue;
		}
		parts.push(start === previous ? String(start) : `${start}-${previous}`);
		start = current;
		previous = current;
	}
	return parts.join(',');
}

export function keepExpression(pageCount, remove) {
	const removed = new Set(remove);
	const kept = [];
	for (let page = 1; page <= pageCount; page += 1) {
		if (!removed.has(page)) kept.push(page);
	}
	if (kept.length === 0) {
		throw Object.assign(new Error('Không thể xóa toàn bộ trang.'), { status: 400 });
	}
	return compressPages(kept);
}

export function parseServerRanges(input, pageCount) {
	if (typeof input !== 'string' || !input.trim()) {
		throw Object.assign(new Error('Khoảng trang không hợp lệ.'), { status: 400 });
	}
	const ranges = [];
	for (const part of input.split(',')) {
		const token = part.trim();
		const match = /^(\d+)(?:-(\d+))?$/.exec(token);
		if (!match) throw Object.assign(new Error('Khoảng trang không hợp lệ.'), { status: 400 });
		const start = Number(match[1]);
		const end = match[2] ? Number(match[2]) : start;
		if (start < 1 || end < start || end > pageCount) {
			throw Object.assign(new Error('Khoảng trang nằm ngoài tài liệu.'), { status: 400 });
		}
		ranges.push(start === end ? String(start) : `${start}-${end}`);
	}
	if (ranges.length === 0) {
		throw Object.assign(new Error('Khoảng trang không hợp lệ.'), { status: 400 });
	}
	return ranges;
}

function assertOrder(order, pageCount) {
	if (!Array.isArray(order) || order.length !== pageCount || new Set(order).size !== pageCount) {
		throw Object.assign(new Error('Thứ tự trang không hợp lệ.'), { status: 400 });
	}
	for (const page of order) {
		if (!Number.isInteger(page) || page < 1 || page > pageCount) {
			throw Object.assign(new Error('Thứ tự trang không hợp lệ.'), { status: 400 });
		}
	}
}

export function rotationArgs(rotations, pageCount) {
	const groups = new Map();
	for (const [key, value] of Object.entries(rotations ?? {})) {
		const page = Number(key);
		const angle = Number(value);
		if (!Number.isInteger(page) || page < 1 || page > pageCount) {
			throw Object.assign(new Error('Trang cần xoay không hợp lệ.'), { status: 400 });
		}
		if (![90, 180, 270].includes(angle)) continue;
		const list = groups.get(angle) ?? [];
		list.push(page);
		groups.set(angle, list);
	}
	return [...groups.entries()].map(([angle, pages]) => `--rotate=+${angle}:${compressPages(pages)}`);
}

export function buildPlan({ operation, options = {}, pageCounts, inputPaths, outputPath }) {
	if (operation === 'decrypt') {
		return [{ args: ['--decrypt', inputPaths[0], outputPath], kind: 'single' }];
	}
	if (operation === 'merge') {
		if (inputPaths.length < 2) {
			throw Object.assign(new Error('Cần ít nhất hai PDF.'), { status: 400 });
		}
		return [
			{
				args: ['--empty', '--pages', ...inputPaths.flatMap((file) => [file, '1-z']), '--', outputPath],
				kind: 'single'
			}
		];
	}
	if (operation === 'split') {
		if (options.mode === 'each') {
			return [{ args: ['--split-pages=1', inputPaths[0], outputPath], kind: 'many' }];
		}
		const ranges = parseServerRanges(String(options.ranges ?? ''), pageCounts[0]);
		return ranges.map((range, index) => ({
			args: [
				inputPaths[0],
				'--pages',
				'.',
				range,
				'--',
				outputPath.replace(/\.pdf$/i, `-${index + 1}.pdf`)
			],
			kind: 'single'
		}));
	}
	if (operation === 'delete') {
		const range = keepExpression(pageCounts[0], options.pages ?? []);
		return [{ args: [inputPaths[0], '--pages', '.', range, '--', outputPath], kind: 'single' }];
	}
	if (operation === 'rotate') {
		const flags = rotationArgs(options.rotations, pageCounts[0]);
		if (flags.length === 0) {
			throw Object.assign(new Error('Chưa có trang cần xoay.'), { status: 400 });
		}
		return [{ args: [inputPaths[0], outputPath, ...flags], kind: 'single' }];
	}
	if (operation === 'organize') {
		assertOrder(options.order, pageCounts[0]);
		return [
			{
				args: [inputPaths[0], '--pages', '.', options.order.join(','), '--', outputPath],
				kind: 'single'
			}
		];
	}
	throw Object.assign(new Error('Thao tác không được hỗ trợ.'), { status: 400 });
}

export function isPdf(buffer) {
	return buffer.length >= 5 && buffer.subarray(0, 5).toString('latin1') === '%PDF-';
}
