import json
ARPU=6.0           # USD/mes plan Pro, neto de IVA
VAR=1.0            # costo variable por usuario Pro (Anthropic ~0,90 + infraestructura ~0,10)
VAR_REG=0.02       # costo variable por usuario registrado activo (infra)
INV0=10324         # inversión inicial: 2 x 8 meses x 40 h x 15 USD = 9600 + Apple 99 + Google 25 + marca/legal 600
FIX={'Railway':40,'Vercel Pro':20,'Expo Starter':19,'Finnhub':50,'Apple (99/12)':8.25,'Contador y legal':80,'Mantenimiento y soporte (20 h x 15 USD)':300}
fixed=sum(FIX.values())
SC={'Pesimista':dict(regs=150,conv=0.02,churn=0.06,mkt=150),
    'Base':dict(regs=300,conv=0.04,churn=0.05,mkt=200),
    'Optimista':dict(regs=600,conv=0.06,churn=0.04,mkt=300)}
r_annual=0.20; r=(1+r_annual)**(1/12)-1
def irr(cfs):
    lo,hi=-0.99,10.0
    f=lambda i: sum(c/(1+i)**t for t,c in enumerate(cfs))
    if f(lo)*f(hi)>0: return None
    for _ in range(200):
        mid=(lo+hi)/2
        if f(lo)*f(mid)<=0: hi=mid
        else: lo=mid
    return mid
out={}
for name,p in SC.items():
    P=0;R=0;cum=-INV0;cfs=[-INV0];rows=[]
    pay=None
    for m in range(1,37):
        R=R*0.97+p['regs']            # registrados activos (3 % abandono mensual)
        P=P*(1-p['churn'])+p['regs']*p['conv']
        rev=P*ARPU
        cost=fixed+p['mkt']+P*VAR+R*VAR_REG+(20 if R>3000 else 0)+(129 if P>300 else 0)
        cf=rev-cost; cfs.append(cf); cum+=cf
        if pay is None and cum>=0: pay=m
        rows.append((m,round(R),round(P,1),round(rev),round(cost),round(cf),round(cum)))
    van=sum(c/(1+r)**t for t,c in enumerate(cfs))
    tir_m=irr(cfs); tir_a=None if tir_m is None else (1+tir_m)**12-1
    be=(fixed+p['mkt'])/(ARPU-VAR)
    out[name]=dict(rows=rows,van=round(van),tir=tir_a,payback=pay,be=round(be),P36=round(P),R36=round(R),rev36=round(rows[-1][3]),cost36=round(rows[-1][4]),cumrev=round(sum(x[3] for x in rows)),cumcost=round(sum(x[4] for x in rows)))
    print(name,'fijos+mkt',fixed+p['mkt'],'BE users',round(be),'P36',round(P),'R36',round(R),'rev36',round(rows[-1][3]),'cost36',round(rows[-1][4]),'VAN',round(van),'TIR',None if tir_a is None else round(tir_a*100,1),'payback',pay)
    for rw in rows[::6]+[rows[-1]]: print('   ',rw)
print('fijos sin mkt',fixed)
json.dump(out,open('viab.json','w'))
