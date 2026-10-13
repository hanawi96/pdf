export function mergeSettleDelay(elapsedMs: number, reduceMotion = false) {
	if (reduceMotion) return 420;
	if (elapsedMs < 650) return Math.max(480, 920 - elapsedMs);
	return 380;
}
