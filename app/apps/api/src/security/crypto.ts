import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
function key(): Buffer {
  const raw = process.env.HOLDINGS_ENCRYPTION_KEY;
  if (!raw && process.env.NODE_ENV === 'production') throw new Error('Falta HOLDINGS_ENCRYPTION_KEY');
  const value = raw ? Buffer.from(raw, 'base64') : Buffer.alloc(32, 7);
  if (value.length !== 32) throw new Error('HOLDINGS_ENCRYPTION_KEY debe contener 32 bytes en base64');
  return value;
}
export function encryptQuantity(value: string): string {
  const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key(), iv);
  cipher.setAAD(Buffer.from('allocia:quantity:v1'));
  const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), encrypted.toString('base64')].join(':');
}
export function decryptQuantity(value: string): string {
  if (!value.startsWith('v1:')) {
    if (process.env.NODE_ENV === 'production') throw new Error('Cantidad sin migrar');
    return value;
  }
  const [, iv, tag, data] = value.split(':');
  const cipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64'));
  cipher.setAAD(Buffer.from('allocia:quantity:v1'));
  cipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([cipher.update(Buffer.from(data, 'base64')), cipher.final()]).toString('utf8');
}
