import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { categorizeTrackers, daysDiff, UPCOMING_DAYS } from '../../lib/api/attention.js';

type MinTracker = {
	id: string;
	reminder_only: boolean;
	status: 'ok' | 'due' | 'overdue';
	next_due_at: string | null;
	next_due_odometer: number | null;
};

const base = (t: MinTracker) => ({ id: t.id, name: 'test' });

const TODAY = '2026-06-01';

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(new Date(TODAY));
});

afterEach(() => {
	vi.useRealTimers();
});

describe('daysDiff', () => {
	it('returns 0 for today', () => {
		expect(daysDiff(TODAY)).toBe(0);
	});

	it('returns positive for future date', () => {
		expect(daysDiff('2026-06-08')).toBe(7);
	});

	it('returns negative for past date', () => {
		expect(daysDiff('2026-05-25')).toBe(-7);
	});
});

describe('categorizeTrackers — km vehicle', () => {
	it('overdue tracker: populates overdue_by in km', () => {
		const tracker: MinTracker = {
			id: 't1',
			reminder_only: false,
			status: 'overdue',
			next_due_at: null,
			next_due_odometer: 9800
		};
		const { overdue } = categorizeTrackers([tracker], 10000, 'km', base);
		expect(overdue).toHaveLength(1);
		expect((overdue[0] as any).overdue_by).toBe(200);
		expect(overdue[0] as any).not.toHaveProperty('overdue_by_km');
	});

	it('due tracker: populates due_in in km', () => {
		const tracker: MinTracker = {
			id: 't1',
			reminder_only: false,
			status: 'due',
			next_due_at: null,
			next_due_odometer: 10300
		};
		const { due } = categorizeTrackers([tracker], 10000, 'km', base);
		expect(due).toHaveLength(1);
		expect((due[0] as any).due_in).toBe(300);
		expect(due[0] as any).not.toHaveProperty('due_in_km');
	});

	it('ok tracker within 500 km lands in upcoming', () => {
		const tracker: MinTracker = {
			id: 't1',
			reminder_only: false,
			status: 'ok',
			next_due_at: null,
			next_due_odometer: 10400
		};
		const { upcoming } = categorizeTrackers([tracker], 10000, 'km', base);
		expect(upcoming).toHaveLength(1);
		expect((upcoming[0] as any).due_in).toBe(400);
	});

	it('ok tracker beyond 500 km not in upcoming', () => {
		const tracker: MinTracker = {
			id: 't1',
			reminder_only: false,
			status: 'ok',
			next_due_at: null,
			next_due_odometer: 10600
		};
		const { upcoming } = categorizeTrackers([tracker], 10000, 'km', base);
		expect(upcoming).toHaveLength(0);
	});
});

describe('categorizeTrackers — mi vehicle', () => {
	it('upcoming threshold is 500 mi same as km', () => {
		const tracker: MinTracker = {
			id: 't1',
			reminder_only: false,
			status: 'ok',
			next_due_at: null,
			next_due_odometer: 10400
		};
		const { upcoming } = categorizeTrackers([tracker], 10000, 'mi', base);
		expect(upcoming).toHaveLength(1);
		expect((upcoming[0] as any).due_in).toBe(400);
	});
});

describe('categorizeTrackers — h vehicle', () => {
	it('overdue_by is in hours', () => {
		const tracker: MinTracker = {
			id: 't1',
			reminder_only: false,
			status: 'overdue',
			next_due_at: null,
			next_due_odometer: 95
		};
		const { overdue } = categorizeTrackers([tracker], 100, 'h', base);
		expect((overdue[0] as any).overdue_by).toBe(5);
		expect(overdue[0] as any).not.toHaveProperty('overdue_by_km');
	});

	it('due_in is in hours', () => {
		const tracker: MinTracker = {
			id: 't1',
			reminder_only: false,
			status: 'due',
			next_due_at: null,
			next_due_odometer: 103
		};
		const { due } = categorizeTrackers([tracker], 100, 'h', base);
		expect((due[0] as any).due_in).toBe(3);
		expect(due[0] as any).not.toHaveProperty('due_in_km');
	});

	it('upcoming threshold is 10h, not 500', () => {
		const near: MinTracker = {
			id: 't_near',
			reminder_only: false,
			status: 'ok',
			next_due_at: null,
			next_due_odometer: 108
		};
		const far: MinTracker = {
			id: 't_far',
			reminder_only: false,
			status: 'ok',
			next_due_at: null,
			next_due_odometer: 115
		};
		const { upcoming: u1 } = categorizeTrackers([near], 100, 'h', base);
		const { upcoming: u2 } = categorizeTrackers([far], 100, 'h', base);
		expect(u1).toHaveLength(1);
		expect(u2).toHaveLength(0);
	});

	it('500h tracker not in upcoming (would be with km threshold)', () => {
		const tracker: MinTracker = {
			id: 't1',
			reminder_only: false,
			status: 'ok',
			next_due_at: null,
			next_due_odometer: 500
		};
		const { upcoming } = categorizeTrackers([tracker], 100, 'h', base);
		expect(upcoming).toHaveLength(0);
	});
});

describe('categorizeTrackers — date-based', () => {
	it('overdue_by_days populated when past due date', () => {
		const tracker: MinTracker = {
			id: 't1',
			reminder_only: false,
			status: 'overdue',
			next_due_at: '2026-05-25',
			next_due_odometer: null
		};
		const { overdue } = categorizeTrackers([tracker], 0, 'km', base);
		expect((overdue[0] as any).overdue_by_days).toBe(7);
		expect(overdue[0] as any).not.toHaveProperty('overdue_by');
	});

	it('upcoming by date within 14 days', () => {
		const tracker: MinTracker = {
			id: 't1',
			reminder_only: false,
			status: 'ok',
			next_due_at: '2026-06-10',
			next_due_odometer: null
		};
		const { upcoming } = categorizeTrackers([tracker], 0, 'km', base);
		expect(upcoming).toHaveLength(1);
		expect((upcoming[0] as any).due_in_days).toBe(9);
	});

	it(`upcoming by date exactly ${UPCOMING_DAYS} days out included`, () => {
		const tracker: MinTracker = {
			id: 't1',
			reminder_only: false,
			status: 'ok',
			next_due_at: '2026-06-15',
			next_due_odometer: null
		};
		const { upcoming } = categorizeTrackers([tracker], 0, 'km', base);
		expect(upcoming).toHaveLength(1);
	});

	it('upcoming by date beyond 14 days excluded', () => {
		const tracker: MinTracker = {
			id: 't1',
			reminder_only: false,
			status: 'ok',
			next_due_at: '2026-07-01',
			next_due_odometer: null
		};
		const { upcoming } = categorizeTrackers([tracker], 0, 'km', base);
		expect(upcoming).toHaveLength(0);
	});
});

describe('categorizeTrackers — edge cases', () => {
	it('reminder_only trackers excluded from all categories', () => {
		const tracker: MinTracker = {
			id: 't1',
			reminder_only: true,
			status: 'overdue',
			next_due_at: '2026-05-01',
			next_due_odometer: 9000
		};
		const result = categorizeTrackers([tracker], 10000, 'km', base);
		expect(result.overdue).toHaveLength(0);
		expect(result.due).toHaveLength(0);
		expect(result.upcoming).toHaveLength(0);
	});

	it('due tracker with past odometer shows overdue_by not due_in', () => {
		const tracker: MinTracker = {
			id: 't1',
			reminder_only: false,
			status: 'due',
			next_due_at: null,
			next_due_odometer: 9900
		};
		const { due } = categorizeTrackers([tracker], 10000, 'km', base);
		expect((due[0] as any).overdue_by).toBe(100);
		expect(due[0] as any).not.toHaveProperty('due_in');
	});
});
