import { assetLogo } from "./logos";
import { universe } from "../market/config";
import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Instrument } from "../entities/instrument.entity";

import { IsIn, IsString, MaxLength, MinLength } from "class-validator";
import { AuthGuard } from "../auth/auth.guard";
import { discover, resolveCandidate } from "./discovery";
class SearchDto { @IsString() @MinLength(2) @MaxLength(60) query:string; }
class ImportDto { @IsIn(['coingecko','finnhub']) provider:'coingecko'|'finnhub'; @IsString() @MaxLength(100) id:string; }
@Controller("catalog")
export class CatalogController {
  constructor(
    @InjectRepository(Instrument)
    private readonly instruments: Repository<Instrument>,
  ) {}

  @Post('search') @UseGuards(AuthGuard)
  search(@Body() dto:SearchDto) { return discover(dto.query); }
  @Post('import') @UseGuards(AuthGuard)
  async importAsset(@Body() dto:ImportDto) {
    const {asset,quote,sector}=await resolveCandidate(dto.provider,dto.id);
    await this.instruments.createQueryBuilder().insert().values({ticker:asset.ticker,name:asset.name,assetClass:asset.kind==='crypto'?'cripto':'accion',sector,region:asset.region,currency:asset.currency,refPrice:'0',marketMapping:asset}).orIgnore().execute();
    const instrument=await this.instruments.findOneByOrFail({ticker:asset.ticker});
    return {...instrument,refPrice:null,quote};
  }
  @Get(':ticker/logo') @UseGuards(AuthGuard)
  async logo(@Param('ticker') ticker:string) {
    if(!/^[A-Za-z0-9.^=-]{1,24}$/.test(ticker))return {dataUri:null,source:null};
    const instrument=await this.instruments.findOneBy({ticker:ticker.toUpperCase()});
    if(!instrument)return {dataUri:null,source:null};
    const asset=instrument.marketMapping??universe().find(a=>a.ticker===instrument.ticker);
    return asset?assetLogo(asset):{dataUri:null,source:null};
  }
  @Get()
  async findAll() {
    const list = await this.instruments.find({ order: { ticker: "ASC" } });
    return list.map((i) => ({ ...i, refPrice: process.env.NODE_ENV === "production" ? null : Number(i.refPrice) }));
  }
}
