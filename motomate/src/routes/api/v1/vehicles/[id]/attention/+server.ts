import type { RequestHandler } from '@sveltejs/kit';
import { getTrackersByVehicle } from '$lib/db/repositories/maintenance.js';
import { apiError } from '$lib/api/response.js';
import { requireAuth, guardVehicle } from '$lib/api/guards.js';
import { syncOdometer } from '$lib/api/effects.js';
import { categorizeTrackers } from '$lib/api/attention.js';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals, params }) => {
	const authErr = requireAuth(locals);
	if (authErr) return authErr;

	const vehicle = await guardVehicle(params.id!, locals.user!.id);
	if (vehicle instanceof Response) return vehicle;

	const trueOdo = await syncOdometer(params.id!, locals.user!.id);
	const trackers = await getTrackersByVehicle(params.id!, locals.user!.id);

	const { overdue, due, upcoming } = categorizeTrackers(trackers, trueOdo, (t) => ({
		id: t.id,
		name: t.template.name,
		status: t.status,
		next_due_at: t.next_due_at ?? null,
		next_due_odometer: t.next_due_odometer ?? null,
		last_done_at: t.last_done_at ?? null,
		last_done_odometer: t.last_done_odometer ?? null,
		interval_km: t.template.interval_km ?? null,
		interval_months: t.template.interval_months ?? null
	}));

	return json({
		data: {
			current_odometer: trueOdo,
			odometer_unit: vehicle.odometer_unit,
			overdue,
			due,
			upcoming
		}
	});
};
