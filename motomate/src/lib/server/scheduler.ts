import { runWorkflowChecks } from '$lib/workflow/engine.js';

const DEFAULT_INTERVAL_HOURS = 1;
const INIT_KEY = Symbol.for('motomate.scheduler.initialized');
const RUNNING_KEY = Symbol.for('motomate.scheduler.running');

export function initScheduler(): void {
	const g = globalThis as Record<symbol, boolean>;
	if (g[INIT_KEY]) return;
	g[INIT_KEY] = true;

	const hours = Number(process.env.CRON_INTERVAL_HOURS ?? DEFAULT_INTERVAL_HOURS);
	const interval = Math.max(hours, 0.1) * 60 * 60 * 1000;

	const run = async () => {
		if (g[RUNNING_KEY]) return;
		g[RUNNING_KEY] = true;
		try {
			await runWorkflowChecks();
		} catch (err) {
			console.error('[scheduler] workflow check failed:', err);
		} finally {
			g[RUNNING_KEY] = false;
		}
	};

	setInterval(run, interval).unref();
	run();
	console.info(`[scheduler] started, interval=${hours}h`);
}
