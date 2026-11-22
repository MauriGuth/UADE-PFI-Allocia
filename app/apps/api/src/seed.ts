import { databaseOptions } from "./database";
// Siembra un portafolio de demostración representativo del usuario objetivo:
// acciones de EE.UU. y Argentina, ETFs, cripto y stablecoins.
// Uso: pnpm --filter api seed
import { DataSource } from "typeorm";
import { Instrument } from "./entities/instrument.entity";
import { User } from "./entities/user.entity";
import * as bcrypt from "bcryptjs";
import { Position } from "./entities/position.entity";
import { CATALOG } from "./catalog/catalog.data";

const DEMO_PORTFOLIO: [string, number][] = [
  ["AAPL", 10],
  ["NVDA", 22],
  ["MSFT", 4],
  ["GGAL", 40],
  ["JPM", 6],
  ["XLE", 12],
  ["SPY", 5],
  ["QQQ", 4],
  ["GLD", 4],
  ["BTC", 0.12],
  ["ETH", 1.5],
  ["SOL", 12],
  ["USDC", 900],
];

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("La siembra demo está prohibida en producción");
  // En Railway se usa DATABASE_URL (inyectada al contenedor); en desarrollo
  // local, el cluster de Postgres.app con la base pfi_demo.
  const ds = new DataSource(databaseOptions());
  await ds.initialize();

  const instruments = ds.getRepository(Instrument);
  const positions = ds.getRepository(Position);
  const users = ds.getRepository(User);

  if ((await instruments.count()) === 0) {
    await instruments.save(CATALOG.map((c) => ({ ...c, refPrice: String(c.refPrice) })));
  }

  // Cuenta demo para la exposición en vivo.
  let demo = await users.findOneBy({ email: "demo@allocia.app" });
  if (!demo) {
    demo = await users.save(
      users.create({
        email: "demo@allocia.app",
        name: "Cuenta Demo",
        passwordHash: await bcrypt.hash("allocia123", 10),
      }),
    );
  }

  await positions.delete({ userId: demo.id });
  for (const [ticker, quantity] of DEMO_PORTFOLIO) {
    const instrument = await instruments.findOneByOrFail({ ticker });
    await positions.save(
      positions.create({ userId: demo.id, ticker, instrument, quantity: String(quantity) }),
    );
  }
  console.log(`Portafolio demo sembrado: ${DEMO_PORTFOLIO.length} posiciones para demo@allocia.app`);
  await ds.destroy();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
