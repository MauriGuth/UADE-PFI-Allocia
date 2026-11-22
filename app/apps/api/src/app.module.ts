import { HealthModule } from "./health.module";
import { MarketModule } from "./market/market.module";
import { databaseOptions } from "./database";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Instrument } from "./entities/instrument.entity";
import { User } from "./entities/user.entity";
import { AuthModule } from "./auth/auth.module";
import { Position } from "./entities/position.entity";
import { CatalogModule } from "./catalog/catalog.module";
import { PortfolioModule } from "./portfolio/portfolio.module";
import { AnalysisModule } from "./analysis/analysis.module";
import { SignalsModule } from "./signals/signals.module";
import { ObservationsModule } from "./observations/observations.module";

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseOptions()),
    AuthModule,
    CatalogModule,
    PortfolioModule,
    AnalysisModule,
    SignalsModule,
    ObservationsModule,
    MarketModule,
    HealthModule,
  ],
})
export class AppModule {}
