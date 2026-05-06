import { describe, expect, it } from 'vitest';
import {
	EXPORT_FORMAT_VERSION,
	EXPORT_MEASUREMENT_CONTRACT,
	SUPPORTED_IMPORT_FORMATS
} from '../lib/export-contract.js';

describe('export measurement contract', () => {
	it('publishes the measurement-aware 2.0 export format', () => {
		expect(EXPORT_FORMAT_VERSION).toBe('2.0');
		expect(SUPPORTED_IMPORT_FORMATS).toEqual(['1.0', '2.0']);
	});

	it('documents canonical measurement fields and retained legacy aliases', () => {
		expect(EXPORT_MEASUREMENT_CONTRACT.canonicalFields.vehicles).toContain('current_measurement');
		expect(EXPORT_MEASUREMENT_CONTRACT.canonicalFields.serviceLogs).toContain(
			'measurement_at_service'
		);
		expect(EXPORT_MEASUREMENT_CONTRACT.retainedLegacyFields.vehicles).toContain('current_odometer');
		expect(EXPORT_MEASUREMENT_CONTRACT.legacyFieldPolicy).toContain(
			'Canonical measurement fields are authoritative'
		);
		expect(EXPORT_MEASUREMENT_CONTRACT.schemaCleanupPolicy).toContain(
			'Physical legacy column deletion is deferred'
		);
	});
});
