import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { DataSource } from "typeorm";
import { User } from "../entities/user.entity";
import { JwtService } from "@nestjs/jwt";

// Guard liviano: valida el Bearer token y adjunta el payload en req.user.
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly db: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const header: string = req.headers["authorization"] ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : req.cookies?.allocia_session;
    if (!token) {
      throw new UnauthorizedException("Sesión requerida");
    }
    try {
      req.user = await this.jwt.verifyAsync(token);
      const user = Number.isInteger(req.user.sub) ? await this.db.getRepository(User).findOneBy({ id: req.user.sub }) : null;
      if (!user || req.user.ver !== user.tokenVersion) {
        throw new UnauthorizedException("Cuenta inexistente");
      }
      return true;
    } catch {
      throw new UnauthorizedException("Sesión inválida o vencida");
    }
  }
}
