export function isReminderTracker(tracker: { reminder_only?: boolean | null }): boolean {
	return tracker.reminder_only ?? false;
}

export function filterTrackersForReport<T extends { reminder_only?: boolean | null }>(
	trackers: T[]
): T[] {
	return trackers.filter((t) => !t.reminder_only);
}
