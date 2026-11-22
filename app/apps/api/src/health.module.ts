import { Controller, Get, Module, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';
@Controller('health')
class HealthController {
  constructor(private readonly db:DataSource){}
  @Get() async health(){try{await this.db.query('SELECT 1');return {status:'ok',commit:process.env.RAILWAY_GIT_COMMIT_SHA??null};}catch{throw new ServiceUnavailableException();}}
}
@Module({controllers:[HealthController]})
export class HealthModule{}
