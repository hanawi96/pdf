export function formatBytes(bytes: number) {
	if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
	const units = ['B', 'KB', 'MB', 'GB'];
	const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
	const value = bytes / 1024 ** index;
	return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
}

export function fileStem(name: string) {
	const stem = name.replace(/\.[^.]+$/, '').trim();
	return stem || 'tai-lieu';
}

export function safeDownloadName(name: string) {
	const cleaned = name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').trim();
	return cleaned.slice(0, 140) || 'tai-lieu';
}

export function createId() {
	if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
	return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
