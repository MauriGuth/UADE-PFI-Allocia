import { MigrationInterface, QueryRunner } from 'typeorm';
export class MarketOpportunities1791417604000 implements MigrationInterface {
  async up(q:QueryRunner) {
    await q.query(`ALTER TABLE users ADD COLUMN "opportunitiesEnabled" boolean NOT NULL DEFAULT false, ADD COLUMN "opportunityScope" text NOT NULL DEFAULT 'all' CHECK ("opportunityScope" IN ('all','watchlist'))`);
    await q.query(`CREATE TABLE market_watchlist ("userId" integer NOT NULL REFERENCES users(id) ON DELETE CASCADE, ticker varchar NOT NULL REFERENCES instruments(ticker), "createdAt" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY("userId",ticker))`);
    await q.query(`ALTER TABLE market_alerts ADD COLUMN kind text NOT NULL DEFAULT 'portfolio' CHECK (kind IN ('portfolio','opportunity'))`);
    await q.query(`CREATE INDEX market_watchlist_ticker ON market_watchlist(ticker)`);
  }
  async down():Promise<void> { throw new Error('Preservar preferencias y seguimientos; restaurar mediante backup validado.'); }
}
