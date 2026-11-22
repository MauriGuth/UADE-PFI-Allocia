import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { IsBoolean, IsIn, IsString, Matches } from 'class-validator';
import { DataSource } from 'typeorm';
import { AuthGuard } from '../auth/auth.guard';
import { universe } from './config';
import { opportunity } from './opportunities';
class Preference { @IsBoolean() enabled:boolean; @IsIn(['all','watchlist']) scope:'all'|'watchlist'; }
class Follow { @IsString() @Matches(/^[A-Z0-9.^=-]{1,24}$/) ticker:string; }
@UseGuards(AuthGuard)
@Controller('market/opportunities')
export class OpportunitiesController {
  constructor(private readonly db:DataSource) {}
  @Get() async list(@Req() req:any) {
    const [preferences]=await this.db.query('SELECT "opportunitiesEnabled" AS enabled,"opportunityScope" AS scope FROM users WHERE id=$1',[req.user.sub]);
    const watchlist=await this.db.query('SELECT w.ticker,i.name FROM market_watchlist w JOIN instruments i ON i.ticker=w.ticker WHERE w."userId"=$1 ORDER BY w.ticker',[req.user.sub]);
    // Select the latest report first: an old upside never masks a newer negative report.
    const rows=await this.db.query(`SELECT latest.*,a.id AS "alertId",a."readAt" FROM
      (SELECT DISTINCT ON (ticker) id,ticker,region,payload,"createdAt" FROM market_reports
       WHERE "createdAt">now()-interval '24 hours' ORDER BY ticker,id DESC) latest
      LEFT JOIN market_alerts a ON a."reportId"=latest.id AND a."userId"=$1 AND a.kind='opportunity'
      WHERE NOT EXISTS(SELECT 1 FROM positions p WHERE p."userId"=$1 AND p.ticker=latest.ticker)
      ORDER BY latest."createdAt" DESC LIMIT 500`,[req.user.sub]);
    const reports=rows.flatMap(row=>{const signal=opportunity(row);return signal?[{...row,opportunity:signal,alertId:row.readAt?null:row.alertId}]:[];});
    const requests=await this.db.query(`SELECT DISTINCT ON (split_part(slot,':',4)) split_part(slot,':',4) AS ticker,status,attempts,"createdAt" FROM market_runs WHERE split_part(slot,':',1)='REQUEST' AND split_part(slot,':',3)=$1 AND "createdAt">now()-interval '24 hours' AND NOT EXISTS(SELECT 1 FROM positions p WHERE p."userId"=$2 AND p.ticker=split_part(slot,':',4)) ORDER BY split_part(slot,':',4),id DESC LIMIT 50`,[String(req.user.sub),req.user.sub]);
    return {preferences,watchlist,reports,requests,coverage:universe().map(a=>({ticker:a.ticker,name:a.name,kind:a.kind})),notice:'Exploramos el universo configurado y los activos seguidos, según las fuentes y el límite diario. No cubre todos los mercados ni garantiza oportunidades. Solo se muestran escenarios alcistas recientes con fuentes específicas del activo.'};
  }
  @Patch('preferences') async preferences(@Req() req:any,@Body() dto:Preference) {
    await this.db.transaction(async m=>{
      await m.query('UPDATE users SET "opportunitiesEnabled"=$1,"opportunityScope"=$2 WHERE id=$3',[dto.enabled,dto.scope,req.user.sub]);
      await m.query(`DELETE FROM push_outbox o USING market_alerts a,market_reports r WHERE a.id=o."alertId" AND r.id=a."reportId" AND a."userId"=$1 AND a.kind='opportunity' AND o.status='pending' AND (NOT $2::boolean OR ($3='watchlist' AND NOT EXISTS(SELECT 1 FROM market_watchlist w WHERE w."userId"=$1 AND w.ticker=r.ticker)))`,[req.user.sub,dto.enabled,dto.scope]);
    });return dto;
  }
  @Post('watchlist') async follow(@Req() req:any,@Body() dto:Follow) {
    await this.db.transaction(async m=>{
      await m.query('SELECT id FROM users WHERE id=$1 FOR UPDATE',[req.user.sub]);
      const [instrument]=await m.query('SELECT "marketMapping" FROM instruments WHERE ticker=$1',[dto.ticker]);
      if(!instrument||(!instrument.marketMapping&&!universe().some(a=>a.ticker===dto.ticker)))throw new BadRequestException('Buscá e importá un activo con cobertura verificable antes de seguirlo.');
      const [{count}]=await m.query('SELECT count(*)::int AS count FROM market_watchlist WHERE "userId"=$1',[req.user.sub]);
      if(count>=50)throw new BadRequestException('Podés seguir hasta 50 activos.');
      await m.query('INSERT INTO market_watchlist("userId",ticker) VALUES($1,$2) ON CONFLICT DO NOTHING',[req.user.sub,dto.ticker]);
    });return {ok:true};
  }
  @Delete('watchlist/:ticker') async unfollow(@Req() req:any,@Param('ticker') ticker:string) {
    await this.db.query('DELETE FROM market_watchlist WHERE "userId"=$1 AND ticker=$2',[req.user.sub,ticker]);return {ok:true};
  }
  @Post('analyze') async analyze(@Req() req:any) {
    const watches=await this.db.query('SELECT ticker FROM market_watchlist WHERE "userId"=$1 ORDER BY ticker',[req.user.sub]);
    const holdings=await this.db.query('SELECT ticker FROM positions WHERE "userId"=$1',[req.user.sub]);
    const held=new Set(holdings.map(r=>r.ticker));
    const candidates=[...new Set([...watches.map(r=>r.ticker),...universe().map(a=>a.ticker)])].filter(t=>!held.has(t)).slice(0,50);
    const hour=new Date().toISOString().slice(0,13);let queued=0;
    for(const ticker of candidates)queued+=(await this.db.query('INSERT INTO market_runs(slot) VALUES($1) ON CONFLICT DO NOTHING RETURNING id',['REQUEST:'+hour+':'+req.user.sub+':'+ticker])).length;
    return {queued,message:candidates.length?`${queued} análisis nuevos en cola. Se revisan hasta 50 activos fuera de tu cartera por solicitud; los seguidos tienen prioridad. Los pedidos de esta hora no se duplican. Solo habrá una alerta si aparece un escenario alcista respaldado y activaste las alertas de oportunidades.`:'Seguí un activo o esperá a que haya cobertura fuera de tu cartera.'};
  }
}
