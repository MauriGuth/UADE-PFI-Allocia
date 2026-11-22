import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";

// Capa de cache para datos de fuentes externas (Sección 4.6 del informe).
// Usa Redis si está disponible y degrada a un Map en memoria si no lo está,
// para que el prototipo siga funcionando en cualquier entorno.
@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis | null = null;
  private readonly memory = new Map<string, { value: string; expiresAt: number }>();

  constructor() {
    // En Railway se define REDIS_URL; en desarrollo local se usa localhost.
    const client = process.env.REDIS_URL
      ? new Redis(process.env.REDIS_URL, {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          retryStrategy: () => null,
        })
      : new Redis({
          host: "localhost",
          port: 6379,
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          retryStrategy: () => null,
        });
    client
      .connect()
      .then(() => {
        this.redis = client;
        this.logger.log("Cache Redis conectada");
      })
      .catch(() => {
        this.logger.warn("Redis no disponible; se usa cache en memoria");
        client.disconnect();
      });
  }

  async get(key: string): Promise<string | null> {
    if (this.redis) return this.redis.get(key);
    const hit = this.memory.get(key);
    if (!hit) return null;
    if (Date.now() > hit.expiresAt) {
      this.memory.delete(key);
      return null;
    }
    return hit.value;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    if (this.redis) {
      await this.redis.set(key, value, "EX", ttlSeconds);
      return;
    }
    this.memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  onModuleDestroy() {
    this.redis?.disconnect();
  }
}
