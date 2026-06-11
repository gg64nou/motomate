import { normalizeWorkflowTrigger } from './triggers.js';
import type { RuleTrigger } from '$lib/db/schema.js';

export function getCooldownHours(trigger: RuleTrigger): number {
	const t = normalizeWorkflowTrigger(trigger);
	if (t.kind === 'no_odometer_update') return t.days * 24;
	if (t.kind === 'document_expiring') return Math.min(t.daysBefore, 7) * 24;
	return 23;
}

export function parseFiredAtMap(raw: string | null): Record<string, string> {
	if (!raw) return {};
	try {
		const parsed = JSON.parse(raw);
		if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
			return parsed as Record<string, string>;
		}
	} catch {}
	return {};
}

export function cooldownKey(vehicleId: string, documentId?: string): string {
	return documentId ? `${vehicleId}/${documentId}` : vehicleId;
}
