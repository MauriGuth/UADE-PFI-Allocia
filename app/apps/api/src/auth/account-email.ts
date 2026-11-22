import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';

type Purpose = 'verify' | 'reset';
const generic = { message:'Si corresponde, recibirás un correo con los próximos pasos.' };
const digest = (token: string) => createHash('sha256').update(token).digest('hex');
function mailOrigin() {
  const value = process.env.PUBLIC_WEB_URL;
  if (!value) throw new ServiceUnavailableException('Correo temporalmente no disponible');
  const url = new URL(value);
  if (url.origin !== value || (url.protocol !== 'https:' && process.env.NODE_ENV !== 'test')) throw new Error('PUBLIC_WEB_URL debe ser un origen HTTPS');
  return url.origin;
}
function mailKey() {
  const key = Buffer.from(process.env.HOLDINGS_ENCRYPTION_KEY ?? '', 'base64');
  if (key.length !== 32) throw new Error('Falta clave de cifrado');
  return key;
}
function encrypt(token: string) {
  const iv=randomBytes(12),c=createCipheriv('aes-256-gcm',mailKey(),iv);
  c.setAAD(Buffer.from('allocia:account-email:v1'));
  const data=Buffer.concat([c.update(token,'utf8'),c.final()]);
  return [iv,c.getAuthTag(),data].map(b=>b.toString('base64')).join(':');
}
function decrypt(secret: string) {
  const [iv,tag,data]=secret.split(':').map(v=>Buffer.from(v,'base64'));
  const c=createDecipheriv('aes-256-gcm',mailKey(),iv);
  c.setAAD(Buffer.from('allocia:account-email:v1'));c.setAuthTag(tag);
  return Buffer.concat([c.update(data),c.final()]).toString('utf8');
}
export async function requestAccountEmail(db: DataSource, email: string, purpose: Purpose) {
  if (!process.env.RESEND_API_KEY || !process.env.MAIL_FROM) throw new ServiceUnavailableException('Correo temporalmente no disponible');
  mailOrigin();mailKey();
  const started=Date.now();
  const token=randomBytes(32).toString('hex'),hash=digest(token),secret=encrypt(token);
  // No network call on this endpoint. The same response is returned for unknown
  // addresses, verified users and cooldown; the worker handles delivery later.
  await db.transaction(async m=> {
    const [user]=await m.query('SELECT id,"tokenVersion","emailVerifiedAt" FROM users WHERE email=$1 FOR UPDATE',[email.trim().toLowerCase()]);
    if (!user || (purpose==='verify' && user.emailVerifiedAt)) return;
    const recent=await m.query(`SELECT id FROM account_email_tokens WHERE "userId"=$1 AND purpose=$2 AND "createdAt">now()-interval '5 minutes' LIMIT 1`,[user.id,purpose]);
    if(recent.length) return;
    await m.query(`INSERT INTO account_email_tokens("userId",purpose,hash,secret,version,"expiresAt") VALUES($1,$2,$3,$4,$5,now()+$6::interval)`,[user.id,purpose,hash,secret,user.tokenVersion,purpose==='reset'?'20 minutes':'24 hours']);
  });
  await new Promise(resolve=>setTimeout(resolve,Math.max(0,300-Date.now())));
  return generic;
}
export async function consumeAccountEmail(db: DataSource, token: string, purpose: Purpose, password?: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) throw new BadRequestException('Enlace inválido o vencido');
  if(purpose==='reset' && (!password || password.length<12 || Buffer.byteLength(password,'utf8')>72)) throw new BadRequestException('La contraseña debe tener al menos 12 caracteres y como máximo 72 bytes');
  const passwordHash=purpose==='reset'?await bcrypt.hash(password!,12):null;
  await db.transaction(async m=> {
    const [candidate]=await m.query('SELECT "userId" FROM account_email_tokens WHERE hash=$1 AND purpose=$2',[digest(token),purpose]);
    if(!candidate) throw new BadRequestException('Enlace inválido o vencido');
    // Consistent user-first lock order also serializes concurrent token issuance.
    const [user]=await m.query('SELECT id,"tokenVersion" FROM users WHERE id=$1 FOR UPDATE',[candidate.userId]);
    const [row]=await m.query(`SELECT id,version FROM account_email_tokens WHERE hash=$1 AND purpose=$2 AND "usedAt" IS NULL AND "expiresAt">now() FOR UPDATE`,[digest(token),purpose]);
    if(!user || !row || row.version!==user.tokenVersion) throw new BadRequestException('Enlace inválido o vencido');
    if(purpose==='reset') {
      await m.query(`UPDATE users SET "passwordHash"=$1,"tokenVersion"="tokenVersion"+1 WHERE id=$2`,[passwordHash,user.id]);
      await m.query('DELETE FROM push_devices WHERE "userId"=$1',[user.id]);
      await m.query(`UPDATE account_email_tokens SET "usedAt"=now(),secret=NULL,status='consumed' WHERE "userId"=$1`,[user.id]);
    } else {
      await m.query('UPDATE users SET "emailVerifiedAt"=COALESCE("emailVerifiedAt",now()) WHERE id=$1',[user.id]);
      await m.query(`UPDATE account_email_tokens SET "usedAt"=now(),secret=NULL,status='consumed' WHERE "userId"=$1 AND purpose='verify'`,[user.id]);
    }
  });
  return {ok:true};
}
export async function dispatchAccountEmails(db: DataSource, send: typeof fetch = fetch) {
  if(!process.env.RESEND_API_KEY || !process.env.MAIL_FROM || !process.env.PUBLIC_WEB_URL) return;
  const origin=mailOrigin();
  // Called under the worker's advisory lock. Ciphertext exists only until delivery.
  const pending=await db.query(`SELECT t.*,u.email FROM account_email_tokens t JOIN users u ON u.id=t."userId" WHERE t.status='pending' AND t.secret IS NOT NULL AND t."usedAt" IS NULL AND t."expiresAt">now() AND t.version=u."tokenVersion" AND t.attempts<3 AND t."nextAttemptAt"<=now() ORDER BY t.id LIMIT 20`);
  for(const row of pending) {
    await db.query(`UPDATE account_email_tokens SET attempts=attempts+1,"nextAttemptAt"=now()+interval '2 minutes' WHERE id=$1`,[row.id]);
    try {
      const link=`${origin}/${row.purpose==='reset'?'reset-password':'verify-email'}#token=${decrypt(row.secret)}`;
      const text=row.purpose==='reset'
        ?`Para cambiar tu contraseña de Allocia, abrí este enlace (vence en 20 minutos):\n${link}\nSi no lo solicitaste, ignorá este correo. Al cambiarla se cerrarán todas tus sesiones.`
        :`Confirmá tu correo de Allocia con este enlace (vence en 24 horas):\n${link}\nSi no creaste esta cuenta, ignorá este correo.`;
      const response=await send('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`allocia-account-${row.hash}`},body:JSON.stringify({from:process.env.MAIL_FROM,to:[row.email],subject:row.purpose==='reset'?'Recuperá tu acceso a Allocia':'Confirmá tu correo de Allocia',text}),signal:AbortSignal.timeout(10000),redirect:'error'});
      if(response.ok) {
        const result=await response.json() as {id?:string};
        if(!result.id) throw new Error('No se confirmó el envío');
        await db.query(`UPDATE account_email_tokens SET status='sent',secret=NULL WHERE id=$1`,[row.id]);
      } else if(response.status<500 && response.status!==429) {
        await db.query(`UPDATE account_email_tokens SET status='failed',secret=NULL WHERE id=$1`,[row.id]);
        console.error(JSON.stringify({event:'account_email_rejected',status:response.status}));
      }
    } catch { console.error(JSON.stringify({event:'account_email_retry'})); }
  }
  await db.query(`UPDATE account_email_tokens SET secret=NULL,status='expired' WHERE "expiresAt"<=now() AND secret IS NOT NULL`);
  await db.query(`UPDATE account_email_tokens t SET secret=NULL,status='revoked' FROM users u WHERE t."userId"=u.id AND t.version<>u."tokenVersion" AND t.secret IS NOT NULL`);
  await db.query(`UPDATE account_email_tokens SET secret=NULL,status='failed' WHERE status='pending' AND attempts>=3`);
  await db.query(`DELETE FROM account_email_tokens WHERE "createdAt"<now()-interval '7 days'`);
}
