import { createHmac, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';

export function rateIdentity(req: any): string {
  const key = process.env.BFF_SIGNING_SECRET;
  const ip = req.headers['x-allocia-ip'];
  const stamp = req.headers['x-allocia-time'];
  const signature = req.headers['x-allocia-signature'];
  if (key && key.length >= 32 && typeof ip === 'string' && isIP(ip) && typeof stamp === 'string'
      && /^\d{13}$/.test(stamp) && Math.abs(Date.now() - Number(stamp)) < 60000
      && typeof signature === 'string' && /^[a-f0-9]{64}$/.test(signature)) {
    const expected = createHmac('sha256', key).update(`${stamp}\n${ip}\n${req.method}\n${req.path}`).digest();
    if (timingSafeEqual(expected, Buffer.from(signature, 'hex'))) return `bff:${ip}`;
  }
  // Enable only behind Railway public HTTP ingress, which supplies X-Real-IP.
  const edgeIP = req.headers['x-real-ip'];
  if (process.env.TRUST_RAILWAY_EDGE === 'true' && process.env.RAILWAY_PROJECT_ID && typeof edgeIP === 'string' && isIP(edgeIP)) return `edge:${edgeIP}`;
  return `socket:${req.ip}`;
}
