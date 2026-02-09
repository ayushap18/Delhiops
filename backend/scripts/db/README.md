# DB Operations Scripts

These scripts support PostgreSQL performance monitoring and routine maintenance.

## Prerequisites
- `psql` CLI installed.
- `DATABASE_URL` exported.
- Migration `database/migrations/001_db_optimization.sql` applied.

## Usage
- Apply optimization migration:
  - `psql "$DATABASE_URL" -f database/migrations/001_db_optimization.sql`
- Refresh materialized views:
  - `psql "$DATABASE_URL" -f scripts/db/refresh-materialized-views.sql`
- Run retention rollup:
  - `psql "$DATABASE_URL" -f scripts/db/run-retention.sql`
- Inspect slow queries:
  - `psql "$DATABASE_URL" -f scripts/db/slow-queries.sql`
- Inspect lock contention:
  - `psql "$DATABASE_URL" -f scripts/db/lock-monitor.sql`
- Inspect table bloat:
  - `psql "$DATABASE_URL" -f scripts/db/bloat-estimate.sql`
- Run manual maintenance:
  - `psql "$DATABASE_URL" -f scripts/db/vacuum-analyze.sql`
