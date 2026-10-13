import { spawn } from 'node:child_process';
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import Busboy from 'busboy';
import { zipSync } from 'fflate';
import { buildPlan, isPdf } from './lib/plan.js';

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '0.0.0.0';
const MAX_FILE_BYTES = Number(process.env.MAX_FILE_BYTES || 150 * 1024 * 1024);
const MAX_PAGES = Number(process.env.MAX_PAGES || 800);
const MAX_CONCURRENT = Number(process.env.MAX_CONCURRENT || 2);
const JOB_TIMEOUT_MS = Number(process.env.JOB_TIMEOUT_MS || 60_000);
const TEMP_ROOT = process.env.TEMP_DIR || tmpdir();

let active = 0;
const waiting = [];

function acquire() {
	if (active < MAX_CONCURRENT) {
		active += 1;
		return Promise.resolve();
	}
	return new Promise((resolve) => waiting.push(resolve));
}

function release() {
	active -= 1;
	const next = waiting.shift();
	if (next) {
		active += 1;
		next();
	}
}

function httpError(status, message) {
	const error = new Error(message);
	error.status = status;
	return error;
}

function runQpdf(args, cwd) {
	return new Promise((resolve, reject) => {
		const child = spawn('qpdf', args, { cwd, timeout: JOB_TIMEOUT_MS });
		let stderr = '';
		child.stderr.on('data', (chunk) => {
			stderr += chunk.toString();
		});
		let stdout = '';
		child.stdout.on('data', (chunk) => {
			stdout += chunk.toString();
		});
		child.on('error', (error) => {
			if (error.code === 'ENOENT') {
				reject(httpError(503, 'qpdf chưa được cài trên máy chủ.'));
				return;
			}
			reject(error);
		});
		child.on('close', (code) => {
			if (code === 0 || code === 3) resolve({ stdout, stderr });
			else if (/password/i.test(stderr)) reject(httpError(401, 'Mật khẩu PDF không đúng.'));
			else reject(httpError(422, stderr.trim() || 'qpdf không xử lý được tệp.'));
		});
	});
}

function parseRequest(req) {
	return new Promise((resolve, reject) => {
		const busboy = Busboy({
			headers: req.headers,
			limits: { files: 30, fileSize: MAX_FILE_BYTES, fields: 20, fieldSize: 1024 * 256 }
		});
		const fields = {};
		const files = [];
		let failed = false;

		busboy.on('field', (name, value) => {
			fields[name] = value;
		});
		busboy.on('file', (name, stream, info) => {
			const chunks = [];
			stream.on('limit', () => {
				failed = true;
				reject(httpError(413, 'File vượt quá giới hạn 150 MB.'));
				stream.resume();
			});
			stream.on('data', (chunk) => chunks.push(chunk));
			stream.on('end', () => {
				if (!failed) {
					files.push({
						field: name,
						filename: info.filename,
						data: Buffer.concat(chunks)
					});
				}
			});
		});
		busboy.on('error', reject);
		busboy.on('finish', () => {
			if (!failed) resolve({ fields, files });
		});
		req.pipe(busboy);
	});
}

async function pageCount(filePath, passwordFile) {
	const args = passwordFile
		? [`--password-file=${passwordFile}`, '--show-npages', filePath]
		: ['--show-npages', filePath];
	const { stdout } = await runQpdf(args);
	const count = Number.parseInt(stdout.trim(), 10);
	if (!Number.isInteger(count) || count < 1) throw httpError(422, 'Không đọc được số trang.');
	if (count > MAX_PAGES) throw httpError(413, `Tài liệu vượt quá ${MAX_PAGES} trang.`);
	return count;
}

async function decryptIfNeeded(dir, file, index, password) {
	const input = path.join(dir, `input-${index}.pdf`);
	await writeFile(input, file.data);
	if (!password) return input;
	const passwordFile = path.join(dir, `password-${index}.txt`);
	const output = path.join(dir, `plain-${index}.pdf`);
	await writeFile(passwordFile, password, { mode: 0o600 });
	await runQpdf([`--password-file=${passwordFile}`, '--decrypt', input, output], dir);
	await rm(passwordFile, { force: true });
	return output;
}

function contentDisposition(name) {
	const fallback = name.replace(/[^\w.\-]+/g, '_');
	return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}

async function processJob(fields, files) {
	const operation = fields.operation;
	if (!['merge', 'split', 'delete', 'rotate', 'organize', 'decrypt'].includes(operation)) {
		throw httpError(400, 'Thao tác không được hỗ trợ.');
	}
	const pdfs = files.filter((file) => file.field === 'files');
	if (pdfs.length === 0) throw httpError(400, 'Thiếu tệp PDF.');
	if (pdfs.some((file) => !isPdf(file.data))) throw httpError(400, 'Có tệp không phải PDF.');

	let passwords = [];
	let options = {};
	try {
		if (fields.passwords) {
			passwords = JSON.parse(fields.passwords);
			if (!Array.isArray(passwords)) throw httpError(400, 'Danh sách mật khẩu không hợp lệ.');
		}
		if (fields.options) options = JSON.parse(fields.options);
	} catch (error) {
		if (error.status) throw error;
		throw httpError(400, 'Dữ liệu gửi lên không hợp lệ.');
	}

	const dir = await mkdtemp(path.join(TEMP_ROOT, 'so-qpdf-'));
	try {
		const inputs = [];
		for (let index = 0; index < pdfs.length; index += 1) {
			inputs.push(await decryptIfNeeded(dir, pdfs[index], index, String(passwords[index] ?? '')));
		}
		if (operation === 'decrypt') {
			return {
				body: await readFile(inputs[0]),
				type: 'application/pdf',
				name: 'da-mo-khoa.pdf'
			};
		}
		const pageCounts = [];
		for (const input of inputs) pageCounts.push(await pageCount(input));
		const outputPath = path.join(dir, 'out.pdf');
		const plan = buildPlan({
			operation,
			options,
			pageCounts,
			inputPaths: inputs,
			outputPath
		});
		for (const step of plan) await runQpdf(step.args, dir);
		if (plan.some((step) => step.kind === 'many') || plan.length > 1) {
			const names = (await readdir(dir)).filter(
				(name) => name.endsWith('.pdf') && !name.startsWith('input-') && !name.startsWith('plain-')
			);
			const archive = {};
			for (const name of names) {
				archive[name] = new Uint8Array(await readFile(path.join(dir, name)));
			}
			return { body: Buffer.from(zipSync(archive, { level: 0 })), type: 'application/zip', name: 'tach-pdf.zip' };
		}
		return { body: await readFile(outputPath), type: 'application/pdf', name: 'so.pdf' };
	} finally {
		await rm(dir, { recursive: true, force: true });
	}
}

const server = createServer(async (req, res) => {
	try {
		if (req.method === 'GET' && req.url === '/health') {
			res.writeHead(200, { 'content-type': 'application/json' });
			res.end(JSON.stringify({ ok: true }));
			return;
		}
		if (req.method !== 'POST' || req.url !== '/process') {
			res.writeHead(404, { 'content-type': 'application/json' });
			res.end(JSON.stringify({ message: 'Không tìm thấy.' }));
			return;
		}
		await acquire();
		try {
			const { fields, files } = await parseRequest(req);
			const result = await processJob(fields, files);
			res.writeHead(200, {
				'content-type': result.type,
				'content-disposition': contentDisposition(result.name),
				'cache-control': 'no-store'
			});
			res.end(result.body);
		} finally {
			release();
		}
	} catch (error) {
		const status = error.status || 500;
		if (!res.headersSent) {
			res.writeHead(status, { 'content-type': 'application/json' });
			res.end(JSON.stringify({ message: error.message || 'Lỗi máy chủ.' }));
		} else {
			res.end();
		}
	}
});

server.listen(PORT, HOST, () => {
	console.log(`qpdf backend listening on ${HOST}:${PORT}`);
});
