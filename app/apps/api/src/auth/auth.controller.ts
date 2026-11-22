import { Body, Controller, Delete, Get, Post, Req, Res, UseGuards, UnauthorizedException } from "@nestjs/common";
import { Equals, IsBoolean, IsEmail, IsString, MinLength, MaxLength, Matches } from "class-validator";
import { DataSource } from 'typeorm';
import { requestAccountEmail, consumeAccountEmail } from './account-email';
import { AuthGuard } from "./auth.guard";
import { AuthService } from "./auth.service";

class RegisterDto {
  @IsString()
  @MaxLength(100)
  @MinLength(2, { message: "El nombre debe tener al menos 2 caracteres" })
  name: string;

  @MaxLength(254)
  @IsEmail({}, { message: "El email no es válido" })
  email: string;

  @IsString()
  @MinLength(12, { message: "La contraseña debe tener al menos 12 caracteres" })
  @MaxLength(72)
  password: string;

  @IsBoolean()
  @Equals(true, { message: "Debés aceptar la política de privacidad" })
  privacyAccepted: boolean;
}

class LoginDto {
  @MaxLength(254)
  @IsEmail({}, { message: "El email no es válido" })
  email: string;

  @IsString()
  password: string;
}

class DeleteAccountDto {
  @IsString()
  @MinLength(1)
  password: string;
}

class EmailDto {
  @IsEmail() @MaxLength(254) email: string;
}
class EmailTokenDto {
  @IsString() @Matches(/^[a-f0-9]{64}$/) token: string;
}
class ResetPasswordDto extends EmailTokenDto {
  @IsString() @MinLength(12) @MaxLength(72) password: string;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly db: DataSource) {}

  @Post('forgot-password')
  forgotPassword(@Body() dto: EmailDto) { return requestAccountEmail(this.db,dto.email,'reset'); }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) { return consumeAccountEmail(this.db,dto.token,'reset',dto.password); }

  @Post('verify-email')
  verifyEmail(@Body() dto: EmailTokenDto) { return consumeAccountEmail(this.db,dto.token,'verify'); }

  @UseGuards(AuthGuard)
  @Post('request-verification')
  async requestVerification(@Req() req: any) {
    const user=await this.auth.findById(req.user.sub);
    if(!user) throw new UnauthorizedException('Cuenta inexistente');
    return requestAccountEmail(this.db,user.email,'verify');
  }

  @Post("register")
  async register(@Body() dto: RegisterDto, @Req() req: any, @Res({ passthrough: true }) res: any) {
    return this.deliver(await this.auth.register(dto.email, dto.password, dto.name, dto.privacyAccepted), req, res);
  }

  @Post("login")
  async login(@Body() dto: LoginDto, @Req() req: any, @Res({ passthrough: true }) res: any) {
    return this.deliver(await this.auth.login(dto.email, dto.password), req, res);
  }

  private deliver(result: any, req: any, res: any) {
    if (req.headers["x-allocia-client"] === "browser") {
      res.cookie("allocia_session", result.token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 7 * 24 * 3600 * 1000 });
      return { user: result.user };
    }
    return result;
  }

  @UseGuards(AuthGuard)
  @Post("logout")
  async logout(@Req() req: any, @Res({ passthrough: true }) res: any) {
    res.clearCookie("allocia_session", { path: "/" });
    return this.auth.logout(req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Delete("me")
  deleteAccount(@Req() req: any, @Body() dto: DeleteAccountDto) {
    return this.auth.deleteAccount(req.user.sub, dto.password);
  }

  @UseGuards(AuthGuard)
  @Get("me")
  async me(@Req() req: any) {
    const user = await this.auth.findById(req.user.sub);
    return user ? { id: user.id, email: user.email, name: user.name, emailVerified:!!user.emailVerifiedAt } : null;
  }

  @UseGuards(AuthGuard)
  @Get("export")
  exportData(@Req() req: any) {
    return this.auth.exportData(req.user.sub);
  }
}
