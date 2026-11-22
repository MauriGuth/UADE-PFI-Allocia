import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { AnalysisService } from "./analysis.service";

@UseGuards(AuthGuard)
@Controller("analysis")
export class AnalysisController {
  constructor(private readonly analysis: AnalysisService) {}

  @Get()
  analyze(@Req() req: any) {
    return this.analysis.analyze(req.user.sub);
  }
}
