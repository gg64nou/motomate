import { describe, it, expect } from 'vitest';
import { isReminderTracker, filterTrackersForReport } from '$lib/utils/reminder-only.js';

describe('isReminderTracker', () => {
	it('returns true for reminder_only tracker', () => {
		expect(isReminderTracker({ reminder_only: true })).toBe(true);
	});

	it('returns false for normal tracker', () => {
		expect(isReminderTracker({ reminder_only: false })).toBe(false);
	});

	it('returns false when reminder_only is undefined', () => {
		expect(isReminderTracker({})).toBe(false);
	});

	it('returns false when reminder_only is null', () => {
		expect(isReminderTracker({ reminder_only: null })).toBe(false);
	});
});

describe('filterTrackersForReport', () => {
	it('excludes reminder_only trackers', () => {
		const trackers = [
			{ id: 't1', reminder_only: false },
			{ id: 't2', reminder_only: true },
			{ id: 't3', reminder_only: false }
		];
		expect(filterTrackersForReport(trackers).map((t) => t.id)).toEqual(['t1', 't3']);
	});

	it('returns all when none are reminder_only', () => {
		const trackers = [
			{ id: 't1', reminder_only: false },
			{ id: 't2', reminder_only: false }
		];
		expect(filterTrackersForReport(trackers)).toHaveLength(2);
	});

	it('returns empty array when all are reminder_only', () => {
		expect(filterTrackersForReport([{ id: 't1', reminder_only: true }])).toHaveLength(0);
	});

	it('passes through non-reminder trackers with all their fields', () => {
		const trackers = [{ id: 't1', reminder_only: false, template: { name: 'Oil change' } }];
		const result = filterTrackersForReport(trackers);
		expect(result[0]).toEqual(trackers[0]);
	});
});
