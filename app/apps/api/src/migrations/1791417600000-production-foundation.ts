import { MigrationInterface, QueryRunner } from 'typeorm';
import { encryptQuantity } from '../security/crypto';
export class ProductionFoundation1791417600000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, email VARCHAR NOT NULL UNIQUE, "passwordHash" VARCHAR NOT NULL, name VARCHAR NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now())`);
    await q.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "tokenVersion" INTEGER NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS "alertsEnabled" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS "privacyAcceptedAt" TIMESTAMP, ADD COLUMN IF NOT EXISTS "privacyVersion" VARCHAR`);
    await q.query(`CREATE TABLE IF NOT EXISTS instruments (ticker VARCHAR PRIMARY KEY, name VARCHAR NOT NULL, "assetClass" VARCHAR NOT NULL, sector VARCHAR NOT NULL, region VARCHAR NOT NULL, currency VARCHAR NOT NULL, "refPrice" NUMERIC(18,6) NOT NULL)`);
    await q.query(`CREATE TABLE IF NOT EXISTS positions (id SERIAL PRIMARY KEY, "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, ticker VARCHAR NOT NULL REFERENCES instruments(ticker), quantity TEXT NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now())`);
    const [{ unsafe }] = await q.query(`SELECT count(*)::int AS unsafe FROM positions p WHERE p."userId" IS NULL OR NOT EXISTS (SELECT 1 FROM users u WHERE u.id=p."userId")`);
    if (unsafe) throw new Error('Hay posiciones sin propietario válido; resolver su titularidad antes de migrar');
    await q.query(`ALTER TABLE positions ALTER COLUMN "userId" SET NOT NULL`);
    // Legacy Railway schema has userId but no FK. Enforce ownership and deletion.
    const foreignKeys = await q.query(`SELECT conname,confdeltype FROM pg_constraint WHERE conrelid='positions'::regclass AND confrelid='users'::regclass AND contype='f'`);
    for (const fk of foreignKeys) {
      if (fk.confdeltype !== 'c') await q.query(`ALTER TABLE positions DROP CONSTRAINT "${String(fk.conname).replace(/"/g,'""')}"`);
    }
    if (!foreignKeys.some((fk: {confdeltype: string}) => fk.confdeltype === 'c')) await q.query(`ALTER TABLE positions ADD CONSTRAINT positions_owner_fk FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE`);
    await q.query(`ALTER TABLE positions ALTER COLUMN quantity TYPE TEXT`);
    const rows = await q.query(`SELECT id, quantity FROM positions WHERE quantity NOT LIKE 'v1:%'`);
    for (const row of rows) await q.query(`UPDATE positions SET quantity=$1 WHERE id=$2`, [encryptQuantity(row.quantity), row.id]);
    // Reject duplicate legacy positions rather than silently merge/delete users' data.
    await q.query(`CREATE UNIQUE INDEX IF NOT EXISTS positions_owner_ticker ON positions("userId",ticker)`);
    await q.query(`CREATE TABLE market_runs (id BIGSERIAL PRIMARY KEY, slot TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'pending', attempts INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(), "finishedAt" TIMESTAMPTZ, error TEXT)`);
    await q.query(`CREATE TABLE market_reports (id BIGSERIAL PRIMARY KEY, "runId" BIGINT NOT NULL REFERENCES market_runs(id), ticker TEXT NOT NULL, region TEXT NOT NULL, payload JSONB NOT NULL, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE("runId",ticker))`);
    await q.query(`CREATE TABLE market_alerts (id BIGSERIAL PRIMARY KEY, "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, "reportId" BIGINT NOT NULL REFERENCES market_reports(id), "readAt" TIMESTAMPTZ, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE("userId","reportId"))`);
    await q.query(`CREATE TABLE push_devices (token TEXT PRIMARY KEY, "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now())`);
    await q.query(`CREATE TABLE push_outbox (id BIGSERIAL PRIMARY KEY, "alertId" BIGINT NOT NULL REFERENCES market_alerts(id) ON DELETE CASCADE, token TEXT NOT NULL REFERENCES push_devices(token) ON DELETE CASCADE, status TEXT NOT NULL DEFAULT 'pending', attempts INTEGER NOT NULL DEFAULT 0, ticket TEXT, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE("alertId",token))`);
  }
  async down(): Promise<void> { throw new Error('Restaurar el backup validado; no se descifran ni destruyen tenencias automáticamente'); }
}
