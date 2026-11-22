import { Module } from "@nestjs/common";
import { Controller, Get } from "@nestjs/common";
import { CacheService } from "./cache.service";
import { SignalsService } from "./signals.service";

@Controller("signals")
class SignalsController {
  constructor(private readonly signals: SignalsService) {}

  @Get()
  get() {
    return this.signals.getSignals();
  }
}

@Module({
  controllers: [SignalsController],
  providers: [SignalsService, CacheService],
  exports: [SignalsService],
})
export class SignalsModule {}
