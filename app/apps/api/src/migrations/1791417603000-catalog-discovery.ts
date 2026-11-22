import { MigrationInterface, QueryRunner } from 'typeorm';
export class CatalogDiscovery1791417603000 implements MigrationInterface {
  async up(q:QueryRunner) { await q.query('ALTER TABLE instruments ADD COLUMN IF NOT EXISTS "marketMapping" JSONB'); }
  async down():Promise<void> { throw new Error('No eliminar los mapeos de activos de las carteras'); }
}
