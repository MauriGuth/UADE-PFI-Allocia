import { Column, Entity, PrimaryColumn } from "typeorm";

export type AssetClass = "accion" | "etf" | "cripto" | "stablecoin";

@Entity("instruments")
export class Instrument {
  @PrimaryColumn()
  ticker: string;

  @Column()
  name: string;

  @Column()
  assetClass: AssetClass;

  @Column()
  sector: string;

  @Column()
  region: string;

  @Column()
  currency: string;

  @Column("jsonb", { nullable: true })
  marketMapping: import("../market/config").MarketAsset | null;

  // Precio de referencia del snapshot de datos (demo). En el MVP final se
  // actualizará desde la capa de integración de fuentes externas.
  @Column("numeric", { precision: 18, scale: 6 })
  refPrice: string;
}
