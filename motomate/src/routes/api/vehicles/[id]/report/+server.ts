import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import { getVehicleById } from '$lib/db/repositories/vehicles.js';
import { getServiceLogsByVehicle } from '$lib/db/repositories/service-logs.js';
import { getTrackersByVehicle } from '$lib/db/repositories/maintenance.js';
import { getDocumentsByIds } from '$lib/db/repositories/documents.js';
import { getFinanceTransactionsByVehicle } from '$lib/db/repositories/finance-transactions.js';
import { getStorage } from '$lib/storage/index.js';
import { buildMaintenanceReport } from '$lib/pdf/maintenance-report.js';

export const GET: RequestHandler = async ({ locals, params, url }) => {
	if (!locals.user) error(401, 'Unauthorized');

	const vehicle = await getVehicleById(params.id, locals.user.id);
	if (!vehicle) error(404, 'Not found');

	const dateFrom = url.searchParams.get('from') ?? undefined;
	const dateTo = url.searchParams.get('to') ?? undefined;
	const noFinance = url.searchParams.has('noFinance');

	const [serviceLogs, trackers, financeTransactions] = await Promise.all([
		getServiceLogsByVehicle(params.id, locals.user.id),
		getTrackersByVehicle(params.id, locals.user.id),
		getFinanceTransactionsByVehicle(params.id, locals.user.id)
	]);

	const trackerNames = new Map(trackers.map((t) => [t.id, t.template.name]));
	const reportLogs = serviceLogs.filter((l) => !l.is_reminder);

	const allDocIds = [...new Set(reportLogs.flatMap((l) => (l.attachments as string[]) ?? []))];
	const docs = allDocIds.length ? await getDocumentsByIds(allDocIds, locals.user.id) : [];

	const storage = getStorage();
	const docBuffers = new Map<string, Buffer>();
	await Promise.all(
		docs.map(async (doc) => {
			try {
				const buf = await storage.getBuffer(doc.storage_key);
				docBuffers.set(doc.id, buf);
			} catch {
				// skip missing files
			}
		})
	);

	const locale = locals.user.settings?.locale ?? 'en';
	const excludedTrackerIds =
		(locals.user.settings?.page_prefs?.maintenance_report_pdf?.[params.id] as
			| string[]
			| undefined) ?? [];

	const pdf = await buildMaintenanceReport({
		vehicle,
		serviceLogs: reportLogs,
		trackerNames,
		docs,
		docBuffers,
		locale,
		excludedTrackerIds,
		dateFrom,
		dateTo,
		includeFinanceSummary: !noFinance,
		financeTransactions
	});

	const safeName = vehicle.name.replace(/[^a-zA-Z0-9-]/g, '_');
	const dateStr = new Date().toISOString().slice(0, 10);

	return new Response(pdf.buffer as ArrayBuffer, {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `attachment; filename="maintenance-report-${safeName}-${dateStr}.pdf"`,
			'Cache-Control': 'no-store'
		}
	});
};
