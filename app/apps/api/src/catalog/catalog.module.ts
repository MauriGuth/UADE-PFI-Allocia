import { AuthModule } from "../auth/auth.module";
import { Module, OnModuleInit } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Instrument } from "../entities/instrument.entity";
import { CatalogController } from "./catalog.controller";
import { CATALOG } from "./catalog.data";

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Instrument])],
  controllers: [CatalogController],
  exports: [TypeOrmModule],
})
export class CatalogModule implements OnModuleInit {
  constructor(
    @InjectRepository(Instrument)
    private readonly instruments: Repository<Instrument>,
  ) {}

  // Siembra el catálogo de clasificación al iniciar si está vacío.
  async onModuleInit() {
    const count = await this.instruments.count();
    if (count === 0) {
      await this.instruments.save(
        CATALOG.map((c) => ({ ...c, refPrice: String(c.refPrice) })),
      );
    }
  }
}
