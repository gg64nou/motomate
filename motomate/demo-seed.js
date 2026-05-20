import Database from 'better-sqlite3';
import { hash } from '@node-rs/argon2';
import { randomBytes } from 'node:crypto';

const ARGON2_OPTS = { memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1 };

function id() {
	return randomBytes(10).toString('hex');
}

export async function seedDemo() {
	const url = process.env.DATABASE_URL ?? './data/motomate.db';
	const sqlite = new Database(url);

	try {
		const existing = sqlite
			.prepare('SELECT id FROM users WHERE email = ?')
			.get('demo@motomate.local');

		if (existing) {
			console.log('[motomate] Demo seed: user already exists, skipping');
			return;
		}

		const passwordHash = await hash('password123', ARGON2_OPTS);
		const userId = id();
		const vehicleId = id();
		const oilTmplId = id();
		const chainTmplId = id();
		const tireTmplId = id();
		const oilTrackerId = id();
		const chainTrackerId = id();
		const tireTrackerId = id();

		const settings = JSON.stringify({
			theme: 'system',
			currency: 'EUR',
			odometer_unit: 'km',
			locale: 'en',
			avatar_seed: id()
		});

		sqlite.transaction(() => {
			sqlite
				.prepare(
					`INSERT INTO users (id, email, password_hash, onboarding_done, settings)
           VALUES (?, ?, ?, 1, ?)`
				)
				.run(userId, 'demo@motomate.local', passwordHash, settings);

			sqlite
				.prepare(
					`INSERT INTO vehicles (id, user_id, type, name, make, model, year,
           current_odometer, current_measurement, current_measurement_unit, odometer_unit, meta)
           VALUES (?, ?, 'motorcycle', 'Honda CB500F', 'Honda', 'CB500F', 2021,
           18400, 18400, 'km', 'km', '{"avatar_emoji":"🏍️"}')`
				)
				.run(vehicleId, userId);

			// Task templates
			sqlite
				.prepare(
					`INSERT INTO task_templates
           (id, user_id, vehicle_id, name, category, description, interval_km, interval_measurement, interval_unit, interval_months, is_preset)
           VALUES (?, ?, ?, 'Oil & Filter Change', 'oil', 'Engine oil and oil filter replacement', 10000, 10000, 'km', 12, 1)`
				)
				.run(oilTmplId, userId, vehicleId);

			sqlite
				.prepare(
					`INSERT INTO task_templates
           (id, user_id, vehicle_id, name, category, description, interval_km, interval_measurement, interval_unit, interval_months, is_preset)
           VALUES (?, ?, ?, 'Chain Clean & Lube', 'chain', 'Clean and lubricate the chain', 500, 500, 'km', NULL, 1)`
				)
				.run(chainTmplId, userId, vehicleId);

			sqlite
				.prepare(
					`INSERT INTO task_templates
           (id, user_id, vehicle_id, name, category, description, interval_km, interval_measurement, interval_unit, interval_months, is_preset)
           VALUES (?, ?, ?, 'Tire Pressure & Wear Check', 'tire', 'Check tyre pressure and inspect tread depth', NULL, NULL, NULL, 1, 1)`
				)
				.run(tireTmplId, userId, vehicleId);

			// Active trackers
			sqlite
				.prepare(
					`INSERT INTO active_trackers
           (id, vehicle_id, template_id, last_done_at, last_done_odometer, last_done_measurement,
           next_due_odometer, next_due_measurement, next_due_at, measurement_unit, status)
           VALUES (?, ?, ?, '2025-04-10', 8000, 8000, 18000, 18000, '2026-04-10', 'km', 'overdue')`
				)
				.run(oilTrackerId, vehicleId, oilTmplId);

			sqlite
				.prepare(
					`INSERT INTO active_trackers
           (id, vehicle_id, template_id, last_done_at, last_done_odometer, last_done_measurement,
           next_due_odometer, next_due_measurement, measurement_unit, status)
           VALUES (?, ?, ?, '2026-04-15', 17950, 17950, 18450, 18450, 'km', 'due')`
				)
				.run(chainTrackerId, vehicleId, chainTmplId);

			sqlite
				.prepare(
					`INSERT INTO active_trackers
           (id, vehicle_id, template_id, last_done_at, next_due_at, status)
           VALUES (?, ?, ?, '2026-05-05', '2026-06-05', 'ok')`
				)
				.run(tireTrackerId, vehicleId, tireTmplId);

			// Service logs
			const sl = sqlite.prepare(
				`INSERT INTO service_logs
         (id, vehicle_id, tracker_id, performed_at, odometer_at_service, measurement_at_service, measurement_unit, cost_cents, currency, notes)
         VALUES (?, ?, ?, ?, ?, ?, 'km', ?, 'EUR', ?)`
			);
			sl.run(id(), vehicleId, null, '2024-10-15', 3000, 3000, 4200, 'Oil & Filter Change');
			sl.run(id(), vehicleId, oilTrackerId, '2025-04-10', 8000, 8000, 4500, 'Oil & Filter Change');
			sl.run(
				id(),
				vehicleId,
				chainTrackerId,
				'2025-06-20',
				10500,
				10500,
				800,
				'Chain Clean & Lube'
			);
			sl.run(
				id(),
				vehicleId,
				chainTrackerId,
				'2025-09-15',
				13200,
				13200,
				800,
				'Chain Clean & Lube'
			);
			sl.run(
				id(),
				vehicleId,
				chainTrackerId,
				'2026-04-15',
				17950,
				17950,
				800,
				'Chain Clean & Lube'
			);

			// Workflow rules
			const wr = sqlite.prepare(
				`INSERT INTO workflow_rules (id, user_id, vehicle_id, name, description, trigger, actions, enabled)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
			);
			wr.run(
				id(),
				userId,
				vehicleId,
				'Oil change overdue',
				'Notify when oil change is past due by 500 km',
				JSON.stringify({ type: 'odometer_overdue', km_past: 500 }),
				JSON.stringify({
					title: 'Oil change overdue',
					body: 'Your Honda CB500F is due for an oil change.'
				}),
				1
			);
			wr.run(
				id(),
				userId,
				vehicleId,
				'Upcoming service reminder',
				'Notify 7 days before a tracker is due by date',
				JSON.stringify({ type: 'date_upcoming', days_before: 7 }),
				JSON.stringify({
					title: 'Service reminder',
					body: 'A scheduled service is coming up in 7 days.'
				}),
				1
			);
			wr.run(
				id(),
				userId,
				null,
				'No odometer update',
				'Notify if no odometer reading logged in 30 days',
				JSON.stringify({ type: 'no_odometer_update', days: 30 }),
				JSON.stringify({
					title: 'No recent activity',
					body: 'No odometer update logged in the last 30 days.'
				}),
				0
			);

			// Finance transactions
			const ft = sqlite.prepare(
				`INSERT INTO finance_transactions
         (id, vehicle_id, user_id, category, amount_cents, currency, notes, performed_at)
         VALUES (?, ?, ?, ?, ?, 'EUR', ?, ?)`
			);
			ft.run(id(), vehicleId, userId, 'fuel', 6000, 'Fuel fill-up', '2026-02-10');
			ft.run(
				id(),
				vehicleId,
				userId,
				'accessories',
				15000,
				'Handlebar grips & bar end weights',
				'2025-11-05'
			);
		})();

		console.log('[motomate] Demo data seeded (demo@motomate.local / password123)');
	} finally {
		sqlite.close();
	}
}
