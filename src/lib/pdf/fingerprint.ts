const SAMPLE = 64 * 1024;

function fnv1a(bytes: Uint8Array) {
	let hash = 0x811c9dc5;
	for (let index = 0; index < bytes.length; index += 1) {
		hash ^= bytes[index];
		hash = Math.imul(hash, 0x01000193);
	}
	return (hash >>> 0).toString(16).padStart(8, '0');
}

export async function fileFingerprint(file: File) {
	const head = new Uint8Array(await file.slice(0, SAMPLE).arrayBuffer());
	const tailStart = Math.max(0, file.size - SAMPLE);
	const tail = new Uint8Array(await file.slice(tailStart).arrayBuffer());
	return `${file.size.toString(16)}-${fnv1a(head)}-${fnv1a(tail)}`;
}
