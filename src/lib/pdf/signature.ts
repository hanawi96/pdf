const HEAD_BYTES = 1_500_000;

export function mayHaveDigitalSignature(bytes: Uint8Array): boolean {
	const decoder = new TextDecoder('latin1');
	const head = decoder.decode(bytes.subarray(0, Math.min(bytes.length, HEAD_BYTES)));
	const tail =
		bytes.length > HEAD_BYTES
			? decoder.decode(bytes.subarray(Math.max(0, bytes.length - HEAD_BYTES)))
			: '';
	const sample = head + tail;
	return sample.includes('/ByteRange') && (sample.includes('/Sig') || sample.includes('/Type /Sig'));
}
