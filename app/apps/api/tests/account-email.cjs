const {test}=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const bcrypt=require('bcryptjs');
const {requestAccountEmail,consumeAccountEmail,dispatchAccountEmails}=require('../dist/auth/account-email');

test('account email: privacy, delivery retries, single use, expiry and session revocation',async()=>{
  if(process.env.DATABASE_URL || !process.env.TEST_DB_NAME || process.env.DB_NAME!==process.env.TEST_DB_NAME || !/(test|validation|ci)/.test(process.env.DB_NAME)) throw new Error('Use an explicit isolated test database');
  process.env.NODE_ENV='test';process.env.PUBLIC_WEB_URL='https://allocia.example';
  process.env.RESEND_API_KEY='synthetic-test-key';process.env.MAIL_FROM='Allocia <test@example.invalid>';
  process.env.HOLDINGS_ENCRYPTION_KEY=Buffer.alloc(32,7).toString('base64');
  const db=require('../dist/database').default;
  await db.initialize();
  let userId;
  try {
    const email=`email-test-${randomUUID()}@example.invalid`;
    const [user]=await db.query(`INSERT INTO users(email,name,"passwordHash","tokenVersion") VALUES($1,'Synthetic test',$2,0) RETURNING id`,[email,await bcrypt.hash('Old-password-test-123',4)]);userId=user.id;
    const known=await requestAccountEmail(db,email,'reset');
    assert.deepEqual(await requestAccountEmail(db,'absent@example.invalid','reset'),known);
    await Promise.all([requestAccountEmail(db,email,'reset'),requestAccountEmail(db,email,'reset')]);
    assert.equal((await db.query('SELECT id FROM account_email_tokens WHERE "userId"=$1',[userId])).length,1);
    const [stored]=await db.query('SELECT * FROM account_email_tokens WHERE "userId"=$1',[userId]);
    let token,firstKey;
    const transport=async(url,options)=>{
      assert.equal(url,'https://api.resend.com/emails');
      const body=JSON.parse(options.body);assert.deepEqual(body.to,[email]);
      const link=body.text.match(/https:\/\/[^\s]+/)[0];
      assert.equal(new URL(link).search,'');
      token=new URLSearchParams(new URL(link).hash.slice(1)).get('token');
      assert.match(token,/^[a-f0-9]{64}$/);assert.notEqual(stored.hash,token);assert.ok(!stored.secret.includes(token));
      if(!firstKey){firstKey=options.headers['Idempotency-Key'];throw new Error('Simulated timeout');}
      assert.equal(options.headers['Idempotency-Key'],firstKey);
      return Response.json({id:'synthetic-delivery-id'});
    };
    await dispatchAccountEmails(db,transport);
    await db.query('UPDATE account_email_tokens SET "nextAttemptAt"=now() WHERE "userId"=$1',[userId]);
    await dispatchAccountEmails(db,transport);
    assert.equal((await db.query('SELECT secret FROM account_email_tokens WHERE "userId"=$1',[userId]))[0].secret,null);
    await assert.rejects(consumeAccountEmail(db,token,'verify'));
    await assert.rejects(consumeAccountEmail(db,token,'reset','é'.repeat(40)));
    const consumed=await Promise.allSettled([consumeAccountEmail(db,token,'reset','New-password-test-123'),consumeAccountEmail(db,token,'reset','New-password-test-123')]);
    assert.equal(consumed.filter(x=>x.status==='fulfilled').length,1);
    const [updated]=await db.query('SELECT * FROM users WHERE id=$1',[userId]);
    assert.equal(updated.tokenVersion,1);assert.ok(await bcrypt.compare('New-password-test-123',updated.passwordHash));
    assert.equal(updated.emailVerifiedAt,null);
    await requestAccountEmail(db,email,'verify');
    firstKey=null;
    await dispatchAccountEmails(db,async(url,options)=>{
      const link=JSON.parse(options.body).text.match(/https:\/\/[^\s]+/)[0];
      token=new URLSearchParams(new URL(link).hash.slice(1)).get('token');
      return Response.json({id:'synthetic-verification-id'});
    });
    await db.query(`UPDATE account_email_tokens SET "expiresAt"=now()-interval '1 second' WHERE "userId"=$1 AND purpose='verify'`,[userId]);
    await assert.rejects(consumeAccountEmail(db,token,'verify'));
    await db.query(`UPDATE account_email_tokens SET "expiresAt"=now()+interval '1 hour' WHERE "userId"=$1 AND purpose='verify'`,[userId]);
    await consumeAccountEmail(db,token,'verify');
    await assert.rejects(consumeAccountEmail(db,token,'verify'));
    assert.ok((await db.query('SELECT "emailVerifiedAt" FROM users WHERE id=$1',[userId]))[0].emailVerifiedAt);
  } finally {
    if(userId) await db.query('DELETE FROM users WHERE id=$1',[userId]);
    await db.destroy();
  }
});
