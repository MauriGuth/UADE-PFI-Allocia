import helmet from 'helmet';
import Redis from 'ioredis';
import { createHash, randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { rateIdentity } from './rate-identity';

export async function secureHttp(app: INestApplication) {
  const production = process.env.NODE_ENV === 'production';
  const origins = (process.env.WEB_ORIGINS ?? (production ? '' : 'http://localhost:3000')).split(',').filter(Boolean);
  if (!origins.length || origins.some(o => new URL(o).origin !== o || (production && !o.startsWith('https://')))) throw new Error('WEB_ORIGINS requiere orígenes explícitos HTTPS en producción');
  if (production && !process.env.REDIS_URL) throw new Error('REDIS_URL es obligatorio para los límites compartidos');
  const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 1, connectTimeout: 3000, lazyConnect: true }) : null;
  redis?.on('error', () => {});
  if (redis) await redis.connect();
  const adapter = app.getHttpAdapter().getInstance();
  adapter.disable('x-powered-by');
  // Only configure a specific trusted proxy CIDR; never trust arbitrary X-Forwarded-For.
  if (process.env.TRUSTED_PROXY_CIDR) adapter.set('trust proxy', process.env.TRUSTED_PROXY_CIDR.split(','));
  app.use(helmet());
  app.use(require('cookie-parser')());
  app.enableCors({ origin: origins, credentials: true, methods: ['GET','POST','PATCH','DELETE'], allowedHeaders: ['Content-Type','Authorization','X-Allocia-Client'] });
  const memory = new Map<string, { count: number; until: number }>();
  app.use(async (req: any, res: any, next: any) => {
    res.setHeader('X-Request-ID', randomUUID());
    res.setHeader('Cache-Control', 'no-store');
    const mutation = !['GET','HEAD','OPTIONS'].includes(req.method);
    const origin = req.headers.origin;
    if ((origin && !origins.includes(origin)) || (mutation && req.cookies?.allocia_session && !origins.includes(origin))) {
      return res.status(403).json({ message: 'Origen no permitido' });
    }
    const auth = /^\/auth\/(login|register|forgot-password|reset-password|verify-email|request-verification)$/.test(req.path);
    const windowMs = auth ? 15 * 60_000 : 60_000;
    const limit = auth ? 20 : 240;
    const hash = createHash('sha256').update(rateIdentity(req)).digest('hex');
    const slot = Math.floor(Date.now() / windowMs);
    const key = `rate:${auth ? 'auth' : 'api'}:${hash}:${slot}`;
    try {
      let count: number;
      if (redis) count = Number(await redis.eval("local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('PEXPIRE',KEYS[1],ARGV[1]) end; return n", 1, key, windowMs));
      else {
        for (const [k,v] of memory) if (v.until < Date.now()) memory.delete(k);
        const v = memory.get(key) ?? { count: 0, until: Date.now() + windowMs };
        count = ++v.count; memory.set(key, v);
      }
      if (count > limit) { res.setHeader('Retry-After', Math.ceil(windowMs/1000)); return res.status(429).json({ message: 'Demasiadas solicitudes. Intentá más tarde.' }); }
      next();
    } catch { res.status(503).json({ message: 'Servicio temporalmente no disponible' }); }
  });
  const originalClose = app.close.bind(app);
  app.close = async () => { redis?.disconnect(); await originalClose(); };
}
