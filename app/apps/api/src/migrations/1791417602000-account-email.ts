import { MigrationInterface, QueryRunner } from 'typeorm';
export class AccountEmail1791417602000 implements MigrationInterface {
  async up(q: QueryRunner) {
    await q.query(`ALTER TABLE users ADD COLUMN "emailVerifiedAt" timestamptz`);
    await q.query(`CREATE TABLE account_email_tokens (
      id bigserial PRIMARY KEY, "userId" integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      purpose text NOT NULL CHECK (purpose IN ('verify','reset')), hash text UNIQUE NOT NULL,
      secret text, version integer NOT NULL, "createdAt" timestamptz NOT NULL DEFAULT now(),
      "expiresAt" timestamptz NOT NULL, "usedAt" timestamptz,
      status text NOT NULL DEFAULT 'pending', attempts integer NOT NULL DEFAULT 0,
      "nextAttemptAt" timestamptz NOT NULL DEFAULT now()
    )`);
    await q.query(`CREATE INDEX account_email_user ON account_email_tokens("userId",purpose,"createdAt")`);
  }
  async down(q: QueryRunner) {
    await q.query('DROP TABLE account_email_tokens');
    await q.query('ALTER TABLE users DROP COLUMN "emailVerifiedAt"');
  }
}
