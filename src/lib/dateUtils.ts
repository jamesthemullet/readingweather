/** Formats a Date as YYYY-MM-DD in UTC. */
export function toDateStr(date: Date): string {
	return date.toISOString().slice(0, 10);
}
