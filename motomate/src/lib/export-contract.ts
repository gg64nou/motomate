export const EXPORT_FORMAT_VERSION = '2.0' as const;

export const SUPPORTED_IMPORT_FORMATS = ['1.0', EXPORT_FORMAT_VERSION] as const;

export const EXPORT_MEASUREMENT_CONTRACT = {
	model: 'measurement',
	canonicalFields: {
		vehicles: ['current_measurement', 'current_measurement_unit'],
		odometerLogs: ['measurement', 'measurement_unit'],
		taskTemplates: ['interval_measurement', 'interval_unit'],
		trackers: ['last_done_measurement', 'next_due_measurement', 'measurement_unit'],
		serviceLogs: ['measurement_at_service', 'measurement_unit'],
		financeTransactions: ['measurement_at_transaction', 'measurement_unit']
	},
	retainedLegacyFields: {
		vehicles: ['current_odometer', 'odometer_unit'],
		odometerLogs: ['odometer'],
		taskTemplates: ['interval_km'],
		trackers: ['last_done_odometer', 'next_due_odometer'],
		serviceLogs: ['odometer_at_service'],
		financeTransactions: ['odometer_at_transaction']
	},
	legacyFieldPolicy:
		'Legacy odometer fields are retained in export 2.0 for compatibility with existing UI/API callers and future 1.0 import bridge code. Canonical measurement fields are authoritative for new importers.',
	schemaCleanupPolicy:
		'Physical legacy column deletion is deferred. The current schema keeps old columns so existing installs, forms, and direct integrations can upgrade safely while canonical measurement fields remain the source of truth.',
	importCompatibility: {
		'1.0':
			'Old exports are distance-only. Importers must hydrate measurement fields from odometer fields using the exported vehicle/user distance unit.',
		'2.0':
			'New exports are measurement-aware. Importers must prefer canonical measurement fields and treat retained odometer fields as compatibility aliases.'
	}
} as const;
