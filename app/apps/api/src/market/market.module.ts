import { OpportunitiesController } from './opportunities.controller';
import { Body, Controller, Delete, Get, Module, NotFoundException, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { IsBoolean, IsString, Matches } from 'class-validator';
import { DataSource } from 'typeorm';
import { AuthGuard } from '../auth/auth.guard';
import { AuthModule } from '../auth/auth.module';
import { universe } from './config';
class PreferencesDto { @IsBoolean() enabled: boolean; }
class DeviceDto { @IsString() @Matches(/^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]{10,200}\]$/) token: string; }
@UseGuards(AuthGuard)
@Controller('market')
class MarketController {
  constructor(private readonly db: DataSource) {}
  @Get('status') async status(@Req() req:any) {
    const [user]=await this.db.query(`SELECT "alertsEnabled" FROM users WHERE id=$1`,[req.user.sub]);
    const [lastRun]=await this.db.query(`SELECT slot,status,"finishedAt",error FROM market_runs WHERE slot NOT LIKE 'REQUEST:%' ORDER BY id DESC LIMIT 1`);
    const requests=await this.db.query(`SELECT DISTINCT ON (split_part(r.slot,':',4))
      split_part(r.slot,':',4) AS ticker, r.status, r.attempts, r."createdAt", r."finishedAt"
      FROM market_runs r WHERE split_part(r.slot,':',1)='REQUEST'
      AND split_part(r.slot,':',3)=$1 AND r."createdAt">now()-interval '24 hours'
      AND EXISTS (SELECT 1 FROM positions p WHERE p."userId"=$2 AND p.ticker=split_part(r.slot,':',4))
      ORDER BY split_part(r.slot,':',4),r.id DESC LIMIT 50`,[String(req.user.sub),req.user.sub]);
    const analysisRequests=requests.map(r=>({...r,state:r.status==='complete'?'ready':r.attempts>=3?'failed':r.status==='running'?'processing':'queued',
      message:r.status==='complete'?'Informe disponible':r.attempts>=3?'No se completó. Puede faltar información o haberse alcanzado el límite diario. Reintentá en la próxima hora.':r.status==='running'?'Consultando fuentes y generando el informe':'En cola o pendiente de reintento; depende de las fuentes y del límite diario'}));
    return {analysisRequests,configured:!!(process.env.ANTHROPIC_API_KEY&&process.env.ANTHROPIC_MODEL&&process.env.FINNHUB_API_KEY),calendarConfigured:!!process.env.MARKET_CALENDAR_FILE,pushEnabled:process.env.PUSH_ENABLED==='true',alertsEnabled:user?.alertsEnabled??false,coverage:universe().map(({ticker,region,exchange})=>({ticker,region,exchange})),lastRun:lastRun??null};
  }
  @Post('analyze') async requestAnalysis(@Req() req:any) {
    const holdings=await this.db.query('SELECT ticker FROM positions WHERE "userId"=$1 ORDER BY ticker LIMIT 50',[req.user.sub]);
    const hour=new Date().toISOString().slice(0,13);
    let queued=0,processing=0,ready=0,failed=0;
    for(const {ticker} of holdings){
      // A request belongs to its user; another user's hourly run must not swallow it.
      const slot='REQUEST:'+hour+':'+req.user.sub+':'+ticker;
      const inserted=await this.db.query("INSERT INTO market_runs(slot) VALUES($1) ON CONFLICT DO NOTHING RETURNING id",[slot]);
      const [run]=await this.db.query('SELECT status,attempts FROM market_runs WHERE slot=$1',[slot]);
      if(run.status==='complete')ready++;
      else if(run.attempts>=3)failed++;
      else if(inserted.length)queued++;
      else processing++;
    }
    const message=!holdings.length?'Tu cartera está vacía. Agregá un activo para analizarlo.':
      [queued?`${queued} análisis en cola.`:'',processing?`${processing} análisis en proceso o pendientes de reintento.`:'',ready?`${ready} análisis de esta hora ya disponibles; no se repiten ni se vuelve a enviar su notificación.`:'',failed?`${failed} análisis no pudieron completarse. Podés reintentar en la próxima hora.`:'',(queued||processing)?'Los informes se actualizan automáticamente. La generación puede tardar unos minutos y depende de las fuentes y del límite diario.':''].filter(Boolean).join(' ');
    return {queued,processing,ready,failed,message};
  }
  @Get('reports') reports(@Req() req:any) {
    return this.db.query(`SELECT DISTINCT ON (r.ticker) r.id,r.ticker,r.region,r.payload,r."createdAt" FROM market_reports r JOIN positions p ON p.ticker=r.ticker WHERE p."userId"=$1 AND r."createdAt">now()-interval '7 days' ORDER BY r.ticker,r.id DESC LIMIT 100`,[req.user.sub]);
  }
  @Get('alerts') alerts(@Req() req:any) { return this.db.query(`SELECT a.id,a."reportId",a."readAt",r."createdAt",r.ticker,r.region,r.payload FROM market_alerts a JOIN market_reports r ON r.id=a."reportId" WHERE a."userId"=$1 AND a.kind='portfolio' AND NOT EXISTS (SELECT 1 FROM market_reports newer WHERE newer.ticker=r.ticker AND newer.id>r.id) ORDER BY a.id DESC LIMIT 100`,[req.user.sub]); }
  @Patch('alerts/:id') async read(@Req() req:any,@Param('id',ParseIntPipe) id:number) {
    const rows=await this.db.query(`UPDATE market_alerts SET "readAt"=now() WHERE id=$1 AND "userId"=$2 RETURNING id`,[id,req.user.sub]); if(!rows[0]?.length) throw new NotFoundException(); return {ok:true};
  }
  @Patch('preferences') async preferences(@Req() req:any,@Body() dto:PreferencesDto) {
    await this.db.transaction(async m=>{await m.query(`UPDATE users SET "alertsEnabled"=$1 WHERE id=$2`,[dto.enabled,req.user.sub]); if(!dto.enabled) await m.query(`DELETE FROM push_outbox WHERE "alertId" IN (SELECT id FROM market_alerts WHERE "userId"=$1 AND kind='portfolio')`,[req.user.sub]);});return {enabled:dto.enabled};
  }
  @Post('devices') async device(@Req() req:any,@Body() dto:DeviceDto) {
    await this.db.transaction(async m=>{
      await m.query(`SELECT id FROM users WHERE id=$1 FOR UPDATE`,[req.user.sub]);
      await m.query(`DELETE FROM push_devices WHERE "userId"=$1 AND token NOT IN (SELECT token FROM push_devices WHERE "userId"=$1 ORDER BY "updatedAt" DESC LIMIT 4)`,[req.user.sub]);
      // Re-assignment on a shared device cancels the previous account's pending notifications.
      await m.query(`DELETE FROM push_outbox WHERE token=$1`,[dto.token]);
      await m.query(`INSERT INTO push_devices(token,"userId") VALUES($1,$2) ON CONFLICT(token) DO UPDATE SET "userId"=$2,"updatedAt"=now()`,[dto.token,req.user.sub]);
    });return {ok:true};
  }
  @Delete('devices') async removeDevice(@Req() req:any,@Body() dto:DeviceDto) {await this.db.query(`DELETE FROM push_devices WHERE token=$1 AND "userId"=$2`,[dto.token,req.user.sub]);return {ok:true};}
}
@Module({imports:[AuthModule],controllers:[MarketController,OpportunitiesController]})
export class MarketModule {}
