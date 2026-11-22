import { Module } from "@nestjs/common";
import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { AnalysisModule } from "../analysis/analysis.module";
import { SignalsModule } from "../signals/signals.module";
import { AuthGuard } from "../auth/auth.guard";
import { ObservationsService } from "./observations.service";

@UseGuards(AuthGuard)
@Controller("observations")
class ObservationsController {
  constructor(private readonly observations: ObservationsService) {}

  @Get()
  generate(@Req() req: any) {
    return this.observations.generate(req.user.sub);
  }
}

@Module({
  imports: [AnalysisModule, SignalsModule],
  controllers: [ObservationsController],
  providers: [ObservationsService],
})
export class ObservationsModule {}
