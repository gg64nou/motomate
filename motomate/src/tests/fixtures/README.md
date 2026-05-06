# Migration fixtures

## `pre-pr-2-motomate.db`

This SQLite fixture represents an empty MotoMate database after migrations `0000_messy_pixie`, `0001_goofy_doctor_doom`, and `0002_left_electro`, but before the PR-2 measurement migration `0003_nice_wonder_man`.

It was generated from the repository migration SQL files by applying `0000` through `0002` and recording those three entries in `__drizzle_migrations` with the hashes/timestamps returned by Drizzle's local `readMigrationFiles` helper. It intentionally contains no user or private data and should remain pre-measurement; verify upgrades by copying it to a temporary path and running `DATABASE_URL=<copy> node migrate.js` from the app root.
