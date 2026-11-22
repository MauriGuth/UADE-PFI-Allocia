import { NextResponse } from 'next/server';
import { backendFetch, clearSession, forbidden, sameOrigin, unreachable } from '@/lib/server/backend';
export async function POST(req: Request, ctx: {params:Promise<{action:string}>}) {
  if(!sameOrigin(req)) return forbidden();
  const {action}=await ctx.params;
  if(!['forgot-password','reset-password','verify-email'].includes(action)) return NextResponse.json({message:'No encontrado'},{status:404});
  try {
    const body=await req.text();
    if(Buffer.byteLength(body)>2048) return NextResponse.json({message:'Solicitud demasiado grande'},{status:413});
    const upstream=await backendFetch(`/auth/${action}`,{method:'POST',body});
    const response=new NextResponse(await upstream.text(),{status:upstream.status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
    return action==='reset-password' && upstream.ok ? clearSession(response) : response;
  } catch(error) { return unreachable(error); }
}
