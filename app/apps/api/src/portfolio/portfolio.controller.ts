import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  Query,
  UseGuards,
} from "@nestjs/common";
import { IsNumber, IsPositive, IsString, Max, Matches, ValidateBy } from "class-validator";
import { AuthGuard } from "../auth/auth.guard";
import { PortfolioService } from "./portfolio.service";

class AddPositionDto {
  @IsString()
  @Matches(/^[A-Za-z0-9.^=-]{1,24}$/)
  ticker: string;

  @IsNumber()
  @ValidateBy({ name: "quantityPrecision", validator: { validate: (v: unknown) => { if (typeof v !== "number" || !Number.isFinite(v)) return false; const [m,e="0"]=String(v).split("e"); return Math.max(0,(m.split(".")[1]?.length ?? 0)-Number(e))<=8; }, defaultMessage: () => "La cantidad admite hasta 8 decimales" } })
  @IsPositive()
  @Max(1000000000)
  quantity: number;
}

class UpdatePositionDto {
  @IsNumber()
  @ValidateBy({ name: "quantityPrecision", validator: { validate: (v: unknown) => { if (typeof v !== "number" || !Number.isFinite(v)) return false; const [m,e="0"]=String(v).split("e"); return Math.max(0,(m.split(".")[1]?.length ?? 0)-Number(e))<=8; }, defaultMessage: () => "La cantidad admite hasta 8 decimales" } })
  @IsPositive()
  @Max(1000000000)
  quantity: number;
}

@UseGuards(AuthGuard)
@Controller("portfolio")
export class PortfolioController {
  constructor(private readonly portfolio: PortfolioService) {}

  @Get("holdings")
  holdings(@Req() req: any) { return this.portfolio.getHoldings(req.user.sub); }

  @Get()
  async get(@Req() req: any, @Query("refresh") refresh?: string) {
    const positions = await this.portfolio.getPositions(req.user.sub,refresh === "true");
    const totalValue = positions.reduce((s, p) => s + p.value, 0);
    return { totalValue, positions, valuationId:positions[0]?.valuationId??null, valuedAt:positions[0]?.valuedAt??null };
  }

  @Post("positions")
  add(@Req() req: any, @Body() dto: AddPositionDto) {
    return this.portfolio.addPosition(req.user.sub, dto.ticker.toUpperCase(), dto.quantity);
  }

  @Patch("positions/:id")
  update(
    @Req() req: any,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdatePositionDto,
  ) {
    return this.portfolio.updatePosition(req.user.sub, id, dto.quantity);
  }

  @Delete("positions/:id")
  remove(@Req() req: any, @Param("id", ParseIntPipe) id: number) {
    return this.portfolio.removePosition(req.user.sub, id);
  }
}
