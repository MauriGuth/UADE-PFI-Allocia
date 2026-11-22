"""Regenera gráficos desde las frecuencias del anexo; no reconstruye microdatos."""
from pathlib import Path
import re
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.ticker import FuncFormatter
R=Path(__file__).resolve().parents[1]
s=(R/'chapters/appendix/user_research.tex').read_text()
questions={}; current=None
for line in s.splitlines():
 m=re.search(r'\\textbf\{(\d+)\.',line)
 if m:current=int(m.group(1));questions[current]=[]
 m=re.search(r'\\quad (.*?) & (\d+) & ([\d,]+)',line)
 if m:questions[current].append((m[1],int(m[2])))
N=190
for q in [1,2,3,5,6,7,9,10,11,12,14,15,17]:
 assert sum(n for _,n in questions[q])==N,(q,questions[q])
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':10,'axes.spines.top':False,'axes.spines.right':False,'axes.spines.left':False,'axes.spines.bottom':False,'pdf.fonttype':42})
def chart(ax,q,title,labels=None):
 data=questions[q]; vals=[n/N*100 for _,n in data]
 labels=labels or [x for x,_ in data]
 ax.barh(range(len(vals)),vals,color='#4b41a4',height=.62)
 ax.set_yticks(range(len(vals)),labels);ax.invert_yaxis()
 ax.set_xlim(0,max(vals)*1.24);ax.set_title(title,loc='left',fontweight='bold',pad=12)
 ax.set_xlabel('Porcentaje de participantes');ax.xaxis.set_major_formatter(FuncFormatter(lambda v,p: f'{v:g}'.replace('.',',')+' %'))
 ax.tick_params(axis='y',length=0);ax.grid(axis='x',alpha=.15);ax.set_axisbelow(True)
 for i,v in enumerate(vals):ax.text(v+max(vals)*.025,i,f'{v:.1f}'.replace('.',',')+' %',va='center',fontsize=10)
def save(name,items,figsize):
 fig,axes=plt.subplots(len(items),1,figsize=figsize,squeeze=False)
 for ax,(q,title,labels) in zip(axes[:,0],items):chart(ax,q,title,labels)
 fig.tight_layout(h_pad=2.2)
 fig.savefig(R/'figures'/f'{name}.pdf',bbox_inches='tight');plt.close(fig)
save('encuesta_perfil',[(1,'Edad',None),(2,'Situación frente a la inversión',['Inversión activa','Seguimiento ocasional','Interés en comenzar','Sin interés actual'])],(10,6.2))
save('encuesta_dificultades',[(8,'Dificultades principales · hasta tres opciones',['Visión consolidada','Tiempo para investigar','Diversificación','Seguimiento cripto / DeFi','Exposición por sector, región y moneda','Interpretación de información','Contexto macro y geopolítico','Confiabilidad de las fuentes','Momento de rebalancear'])],(10,4.8))
save('encuesta_funcionalidades',[(13,'Funciones valoradas · hasta tres opciones',['Vista consolidada','Diversificación y exposición','Observaciones explicables','Alertas geopolíticas','Sugerencias de rebalanceo','Información fundamental','Señales cripto y de eventos'])],(10,4.2))
save('encuesta_interes',[(12,'Interés en la plataforma web',['1 · Nada interesado','2','3','4','5 · Muy interesado']),(17,'Disposición declarada a pagar',['Versión gratuita con funciones pagas','Suscripción mensual','Sólo si es gratuita','No la usaría'])],(10,6.5))
print('4 gráficos regenerados; 13 distribuciones de opción única suman N=190.')
