const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createHmac}=require('node:crypto');
const {rateIdentity}=require('../dist/security/rate-identity');
const {dueSlots}=require('../dist/market/config');
test('IP forwarding requires a valid signature bound to path, method and time',()=>{
  process.env.BFF_SIGNING_SECRET='synthetic-test-key-of-at-least-32-characters';
  delete process.env.TRUST_RAILWAY_EDGE;
  const stamp=String(Date.now()),ip='192.0.2.10';
  const signature=createHmac('sha256',process.env.BFF_SIGNING_SECRET).update(`${stamp}\n${ip}\nPOST\n/auth/login`).digest('hex');
  const req={method:'POST',path:'/auth/login',ip:'127.0.0.1',headers:{'x-allocia-ip':ip,'x-allocia-time':stamp,'x-allocia-signature':signature}};
  assert.equal(rateIdentity(req),'bff:'+ip);
  assert.equal(rateIdentity({...req,path:'/auth/register'}),'socket:127.0.0.1');
  assert.equal(rateIdentity({...req,headers:{...req.headers,'x-allocia-time':'1000000000000'}}),'socket:127.0.0.1');
  assert.equal(rateIdentity({...req,headers:{'x-real-ip':'203.0.113.7'}}),'socket:127.0.0.1');
  delete process.env.BFF_SIGNING_SECRET;
});
test('crypto cuts remain available when the equity calendar cannot be read',()=>{
  process.env.MARKET_CALENDAR_FILE='/nonexistent-calendar.json';
  assert.throws(()=>dueSlots(new Date('2026-10-09T12:01:00Z')));
  assert.deepEqual(dueSlots(new Date('2026-10-09T12:01:00Z'),false).map(x=>x.exchange),['CRYPTO']);
  delete process.env.MARKET_CALENDAR_FILE;
});
