import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('$lib/db/repositories/vehicles.js', () => ({
	getVehiclesByUser: vi.fn(),
	getVehicleById: vi.fn(),
	recomputeCurrentOdometer: vi.fn()
}));
vi.mock('$lib/db/repositories/maintenance.js', () => ({
	getTrackersByVehicle: vi.fn(),
	recomputeTrackerStatuses: vi.fn()
}));

import { GET as allAttention } from '../../routes/api/v1/vehicles/attention/+server.js';
import { GET as vehicleAttention } from '../../routes/api/v1/vehicles/[id]/attention/+server.js';
import {
	getVehiclesByUser,
	getVehicleById,
	recomputeCurrentOdometer
} from '$lib/db/repositories/vehicles.js';
import {
	getTrackersByVehicle,
	recomputeTrackerStatuses
} from '$lib/db/repositories/maintenance.js';

const mockUser = { id: 'u_1' } as any;
const mockVehicle = { id: 'v_1', user_id: 'u_1', name: 'CB500F', odometer_unit: 'km' } as any;

const okTracker = {
	id: 't_ok',
	status: 'ok',
	reminder_only: false,
	next_due_at: null,
	next_due_odometer: null,
	last_done_at: null,
	last_done_odometer: null,
	template: { name: 'Tire check', interval_km: 5000, interval_months: null }
} as any;
const dueTracker = {
	id: 't_due',
	status: 'due',
	reminder_only: false,
	next_due_at: '2026-06-01',
	next_due_odometer: 10200,
	last_done_at: '2026-01-01',
	last_done_odometer: 9000,
	template: { name: 'Oil change', interval_km: 5000, interval_months: null }
} as any;
const overdueTracker = {
	id: 't_ov',
	status: 'overdue',
	reminder_only: false,
	next_due_at: '2026-05-01',
	next_due_odometer: 9900,
	last_done_at: '2025-12-01',
	last_done_odometer: 8000,
	template: { name: 'Chain lube', interval_km: 500, interval_months: null }
} as any;
const reminderTracker = {
	id: 't_rem',
	status: 'overdue',
	reminder_only: true,
	next_due_at: null,
	next_due_odometer: null,
	template: { name: 'Insurance', interval_km: null, interval_months: 12 }
} as any;

function event(user = mockUser, params: Record<string, string> = {}) {
	return {
		locals: { user, session: null },
		params,
		url: new URL('http://localhost'),
		request: new Request('http://localhost')
	} as any;
}

beforeEach(() => {
	vi.mocked(getVehiclesByUser).mockResolvedValue([mockVehicle]);
	vi.mocked(getVehicleById).mockResolvedValue(mockVehicle);
	vi.mocked(recomputeCurrentOdometer).mockResolvedValue(10000);
	vi.mocked(recomputeTrackerStatuses).mockResolvedValue([]);
	vi.mocked(getTrackersByVehicle).mockResolvedValue([okTracker]);
});

describe('GET /vehicles/attention (all vehicles)', () => {
	it('returns only vehicles with attention items', async () => {
		vi.mocked(getTrackersByVehicle).mockResolvedValue([overdueTracker]);
		const body = await (await allAttention(event())).json();
		expect(body.data).toHaveLength(1);
		expect(body.data[0].vehicle_id).toBe('v_1');
	});

	it('returns empty array when no vehicles need attention', async () => {
		vi.mocked(getTrackersByVehicle).mockResolvedValue([okTracker]);
		const body = await (await allAttention(event())).json();
		expect(body.data).toHaveLength(0);
	});

	it('populates overdue array with overdue_by_km', async () => {
		vi.mocked(getTrackersByVehicle).mockResolvedValue([overdueTracker]);
		const body = await (await allAttention(event())).json();
		const v = body.data[0];
		expect(v.overdue).toHaveLength(1);
		expect(v.overdue[0].overdue_by_km).toBe(100);
	});

	it('excludes reminder_only trackers', async () => {
		vi.mocked(getTrackersByVehicle).mockResolvedValue([reminderTracker]);
		const body = await (await allAttention(event())).json();
		expect(body.data).toHaveLength(0);
	});

	it('includes vehicle name and odometer in each entry', async () => {
		vi.mocked(getTrackersByVehicle).mockResolvedValue([dueTracker]);
		const body = await (await allAttention(event())).json();
		expect(body.data[0].vehicle_name).toBe('CB500F');
		expect(body.data[0].current_odometer).toBe(10000);
	});

	it('returns 401 without user', async () => {
		expect((await allAttention(event(null))).status).toBe(401);
	});
});

describe('GET /vehicles/:id/attention (single vehicle)', () => {
	it('returns 200 with overdue/due/upcoming structure', async () => {
		vi.mocked(getTrackersByVehicle).mockResolvedValue([overdueTracker, dueTracker, okTracker]);
		const res = await vehicleAttention(event(mockUser, { id: 'v_1' }));
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.data).toHaveProperty('overdue');
		expect(body.data).toHaveProperty('due');
		expect(body.data).toHaveProperty('upcoming');
		expect(body.data.current_odometer).toBe(10000);
	});

	it('puts overdue tracker in overdue with overdue_by_km', async () => {
		vi.mocked(getTrackersByVehicle).mockResolvedValue([overdueTracker]);
		const body = await (await vehicleAttention(event(mockUser, { id: 'v_1' }))).json();
		expect(body.data.overdue).toHaveLength(1);
		expect(body.data.overdue[0].name).toBe('Chain lube');
		expect(body.data.overdue[0].overdue_by_km).toBe(100);
	});

	it('puts due tracker in due with due_in_km', async () => {
		vi.mocked(getTrackersByVehicle).mockResolvedValue([dueTracker]);
		const body = await (await vehicleAttention(event(mockUser, { id: 'v_1' }))).json();
		expect(body.data.due).toHaveLength(1);
		expect(body.data.due[0].due_in_km).toBe(200);
	});

	it('excludes ok tracker that is not upcoming', async () => {
		const farTracker = { ...okTracker, next_due_odometer: 20000, next_due_at: '2027-01-01' };
		vi.mocked(getTrackersByVehicle).mockResolvedValue([farTracker]);
		const body = await (await vehicleAttention(event(mockUser, { id: 'v_1' }))).json();
		expect(body.data.upcoming).toHaveLength(0);
	});

	it('puts ok tracker in upcoming when within 500km', async () => {
		const nearTracker = { ...okTracker, next_due_odometer: 10400, next_due_at: null };
		vi.mocked(getTrackersByVehicle).mockResolvedValue([nearTracker]);
		const body = await (await vehicleAttention(event(mockUser, { id: 'v_1' }))).json();
		expect(body.data.upcoming).toHaveLength(1);
		expect(body.data.upcoming[0].due_in_km).toBe(400);
	});

	it('excludes reminder_only trackers', async () => {
		vi.mocked(getTrackersByVehicle).mockResolvedValue([reminderTracker]);
		const body = await (await vehicleAttention(event(mockUser, { id: 'v_1' }))).json();
		expect(body.data.overdue).toHaveLength(0);
	});

	it('returns 404 when vehicle not found', async () => {
		vi.mocked(getVehicleById).mockResolvedValue(undefined);
		expect((await vehicleAttention(event(mockUser, { id: 'bad' }))).status).toBe(404);
	});

	it('returns 401 without user', async () => {
		expect((await vehicleAttention(event(null, { id: 'v_1' }))).status).toBe(401);
	});
});
