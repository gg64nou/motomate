export function shouldCreateServiceLog(tracker: { reminder_only?: boolean | null }): boolean {
	return !tracker.reminder_only;
}

export function filterTrackersForReport<T extends { reminder_only?: boolean | null }>(
	trackers: T[]
): T[] {
	return trackers.filter((t) => !t.reminder_only);
}
