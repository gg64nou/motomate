import { describe, it, expect } from 'vitest';
import { shouldCreateServiceLog, filterTrackersForReport } from '$lib/utils/reminder-only.js';

describe('shouldCreateServiceLog', () => {
	it('returns false for reminder_only tracker', () => {
		expect(shouldCreateServiceLog({ reminder_only: true })).toBe(false);
	});

	it('returns true for normal tracker', () => {
		expect(shouldCreateServiceLog({ reminder_only: false })).toBe(true);
	});

	it('returns true when reminder_only is undefined', () => {
		expect(shouldCreateServiceLog({})).toBe(true);
	});

	it('returns true when reminder_only is null', () => {
		expect(shouldCreateServiceLog({ reminder_only: null })).toBe(true);
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
