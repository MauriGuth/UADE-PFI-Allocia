import {
  ConflictException,
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcryptjs";
import { User } from "../entities/user.entity";
import { decryptQuantity } from "../security/crypto";

export interface AuthResult {
  token: string;
  user: { id: number; email: string; name: string };
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
  ) {}

  private async result(user: User): Promise<AuthResult> {
    const token = await this.jwt.signAsync({ sub: user.id, ver: user.tokenVersion ?? 0 });
    return { token, user: { id: user.id, email: user.email, name: user.name } };
  }

  async register(email: string, password: string, name: string, privacyAccepted = false): Promise<AuthResult> {
    if (password.length < 12 || Buffer.byteLength(password, "utf8") > 72) throw new BadRequestException("La contraseña debe tener al menos 12 caracteres y como máximo 72 bytes");
    if (name.trim().length < 2) throw new BadRequestException("Nombre inválido");
    if (!privacyAccepted) throw new BadRequestException("Debés aceptar la política de privacidad");
    const normalized = email.trim().toLowerCase();
    const existing = await this.users.findOneBy({ email: normalized });
    if (existing) {
      throw new ConflictException("Ya existe una cuenta con ese email");
    }
    let user: User;
    try { user = await this.users.save(
      this.users.create({
        email: normalized,
        name: name.trim(),
        passwordHash: await bcrypt.hash(password, 12),
        privacyAcceptedAt: new Date(),
        privacyVersion: "2026-10-09",
      }),
    );
    } catch (e) { if ((e as any).code === "23505") throw new ConflictException("Ya existe una cuenta con ese email"); throw e; }
    return this.result(user);
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.users.findOneBy({ email: email.trim().toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException("Email o contraseña incorrectos");
    }
    return this.result(user);
  }

  async deleteAccount(id: number, password: string): Promise<{ ok: true }> {
    const user = await this.users.findOneBy({ id });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException("Contraseña incorrecta");
    }
    // La FK ON DELETE CASCADE elimina las posiciones en la misma operación.
    await this.users.delete({ id });
    return { ok: true };
  }

  async logout(id: number) {
    await this.users.manager.transaction(async manager => {
      await manager.increment(User, { id }, "tokenVersion", 1);
      await manager.query(`DELETE FROM push_devices WHERE "userId"=$1`, [id]);
    });
    return { ok: true };
  }

  async findById(id: number): Promise<User | null> {
    return this.users.findOneBy({ id });
  }

  async exportData(id: number) {
    const user = await this.users.findOneBy({ id });
    if (!user) throw new UnauthorizedException("Cuenta inexistente");
    const positions = await this.users.manager.query(
      `SELECT ticker, quantity, "createdAt" FROM positions WHERE "userId"=$1 ORDER BY id`,
      [id],
    );
    const alerts = await this.users.manager.query(
      `SELECT r.ticker, a."createdAt", a."readAt" FROM market_alerts a JOIN market_reports r ON r.id=a."reportId" WHERE a."userId"=$1 ORDER BY a.id`,
      [id],
    );
    return {
      exportedAt: new Date().toISOString(),
      account: {
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        alertsEnabled: user.alertsEnabled,
        opportunitiesEnabled: user.opportunitiesEnabled,
        opportunityScope: user.opportunityScope,
        privacyAcceptedAt: user.privacyAcceptedAt,
        privacyVersion: user.privacyVersion,
      },
      positions: positions.map((position: { ticker: string; quantity: string; createdAt: Date }) => ({
        ...position,
        quantity: Number(decryptQuantity(position.quantity)),
      })),
      alerts,
      watchlist: await this.users.manager.query('SELECT ticker,"createdAt" FROM market_watchlist WHERE "userId"=$1 ORDER BY ticker',[id]),
    };
  }
}
