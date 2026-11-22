import { MarketOpportunities1791417604000 } from './migrations/1791417604000-market-opportunities';
import 'dotenv/config';
import { CatalogDiscovery1791417603000 } from './migrations/1791417603000-catalog-discovery';
import { DataSource, DataSourceOptions } from 'typeorm';
import { checkServerIdentity } from 'node:tls';
import { Instrument } from './entities/instrument.entity';
import { User } from './entities/user.entity';
import { Position } from './entities/position.entity';
import { ProductionFoundation1791417600000 } from './migrations/1791417600000-production-foundation';
import { PrivacyConsent1791417601000 } from './migrations/1791417601000-privacy-consent';
import { AccountEmail1791417602000 } from './migrations/1791417602000-account-email';
export function databaseOptions(): DataSourceOptions {
  const production = process.env.NODE_ENV === 'production';
  if (production && !process.env.DATABASE_URL) throw new Error('DATABASE_URL es obligatorio en producción');
  if (production && process.env.DB_SYNCHRONIZE === 'true') throw new Error('synchronize está prohibido en producción');
  if (process.env.DB_TLS_SERVERNAME && !process.env.DB_CA_PEM) throw new Error('Un nombre TLS explícito requiere el certificado de confianza DB_CA_PEM');
  return {
    type: 'postgres',
    ...(process.env.DATABASE_URL ? { url: process.env.DATABASE_URL } : {
      host: process.env.DB_HOST ?? 'localhost', port: Number(process.env.DB_PORT ?? 5432), username: process.env.DB_USER ?? process.env.USER,
      password: process.env.DB_PASS ?? '', database: process.env.DB_NAME ?? 'pfi_demo',
    }),
    // pg sets SNI to its connection host. Validate the configured certificate name
    // with Node's normal verifier when a legacy private certificate uses an alias.
    ssl: production || process.env.DB_TLS === 'true' ? {
      rejectUnauthorized: true,
      ...(process.env.DB_CA_PEM ? { ca: process.env.DB_CA_PEM } : {}),
      ...(process.env.DB_TLS_SERVERNAME ? { checkServerIdentity: (_host: string, cert: any) => checkServerIdentity(process.env.DB_TLS_SERVERNAME!, cert) } : {}),
    } : false,
    entities: [Instrument, Position, User],
    migrations: [ProductionFoundation1791417600000, PrivacyConsent1791417601000, AccountEmail1791417602000, CatalogDiscovery1791417603000, MarketOpportunities1791417604000],
    synchronize: false, migrationsRun: false,
    extra: { max: 10, statement_timeout: 15000 },
  };
}
export default new DataSource(databaseOptions());
