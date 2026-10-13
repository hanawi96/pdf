export function reorder<T>(items: readonly T[], from: number, to: number): T[] {
	if (
		!Number.isInteger(from) ||
		!Number.isInteger(to) ||
		from === to ||
		from < 0 ||
		to < 0 ||
		from >= items.length ||
		to >= items.length
	) {
		return items as T[];
	}
	const next = items.slice();
	const [item] = next.splice(from, 1);
	next.splice(to, 0, item);
	return next;
}
