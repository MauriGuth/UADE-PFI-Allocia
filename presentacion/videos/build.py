#!/usr/bin/env python3
"""Genera un video 1920x1080 a partir de una especificación de diapositivas + narración.
Uso: python3 build.py spec_video1.py
"""
import sys,os,json,subprocess,html,importlib.util,shutil
HERE=os.path.dirname(os.path.abspath(__file__))
BROWSE=os.environ.get('BROWSE','browse')  # ruta al navegador headless
VOICE=os.environ.get('VOICE','Paulina'); RATE=os.environ.get('RATE','172')
CSS="""
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1920px;height:1080px;overflow:hidden;background:#F7F9FB;font-family:Inter,system-ui,sans-serif;color:#091426}
.slide{position:relative;width:1920px;height:1080px;padding:90px 110px 70px 110px;display:flex;flex-direction:column}
.bar{position:absolute;left:0;top:0;width:100%;height:14px;background:linear-gradient(90deg,#091426 0%,#4B41E1 60%,#E2DFFF 100%)}
.foot{position:absolute;left:110px;right:110px;bottom:34px;display:flex;justify-content:space-between;align-items:center;font-size:22px;color:#5b6475}
.foot img{height:34px}
.kicker{font-size:26px;font-weight:600;color:#4B41E1;letter-spacing:.06em;text-transform:uppercase;margin-bottom:10px}
h1{font-size:64px;font-weight:800;line-height:1.08;letter-spacing:-.01em;margin-bottom:34px}
h1.small{font-size:54px}
.cols{display:flex;gap:60px;flex:1;min-height:0}
.col{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center}
.col.w40{flex:0 0 40%}.col.w55{flex:0 0 55%}.col.w60{flex:0 0 60%}
ul{list-style:none;font-size:34px;line-height:1.38}
ul li{padding-left:44px;position:relative;margin-bottom:22px}
ul li::before{content:'';position:absolute;left:0;top:16px;width:18px;height:18px;border-radius:5px;background:#4B41E1}
ul.tight li{font-size:30px;margin-bottom:14px}
.img{display:flex;align-items:center;justify-content:center;height:100%;min-height:0}
.img img{max-width:100%;max-height:100%;object-fit:contain;border-radius:18px}
.img.card img{box-shadow:0 18px 50px rgba(9,20,38,.16);background:#fff}
.img.phone img{max-height:100%;border-radius:36px;box-shadow:0 18px 50px rgba(9,20,38,.2)}
.phones{display:flex;gap:40px;align-items:center;justify-content:center;height:100%}
.phones img{max-height:90%;border-radius:36px;box-shadow:0 18px 50px rgba(9,20,38,.2)}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:40px;margin-top:10px}
.stat{background:#fff;border:2px solid #E2DFFF;border-radius:22px;padding:34px 38px}
.stat b{display:block;font-size:72px;font-weight:800;color:#4B41E1;line-height:1}
.stat span{display:block;font-size:26px;color:#3a4356;margin-top:14px;line-height:1.3}
.quote{background:#fff;border-left:12px solid #4B41E1;border-radius:0 22px 22px 0;padding:30px 40px;font-size:32px;line-height:1.4;font-style:italic;color:#1e2838;margin-bottom:26px;box-shadow:0 10px 30px rgba(9,20,38,.08)}
.quote small{display:block;font-style:normal;font-size:24px;color:#5b6475;margin-top:12px}
.title{justify-content:center;align-items:flex-start;background:#091426;color:#fff}
.title h1{font-size:86px;color:#fff;max-width:1500px}
.title .sub{font-size:38px;color:#E2DFFF;margin-bottom:60px;max-width:1500px;line-height:1.35}
.title .meta{font-size:30px;color:#b9b4ff;line-height:1.5}
.title .kicker{color:#E2DFFF}
.title img.logo{height:120px;margin-bottom:50px}
table.cmp{border-collapse:collapse;width:100%;font-size:28px;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(9,20,38,.08)}
table.cmp th,table.cmp td{padding:16px 20px;text-align:center;border-bottom:1px solid #E2DFFF}
table.cmp th{background:#091426;color:#fff;font-weight:600;font-size:26px}
table.cmp td:first-child{text-align:left;font-weight:600}
table.cmp tr.hl td{background:#eeedff;font-weight:700;color:#2b24a3}
.y{color:#15803d;font-weight:700}.n{color:#b91c1c}.p{color:#b45309;font-weight:600}
.tag{display:inline-block;background:#E2DFFF;color:#2b24a3;border-radius:999px;padding:6px 18px;font-size:24px;font-weight:600;margin:0 10px 12px 0}
.steps{display:flex;gap:26px;margin-top:10px}
.step{flex:1;background:#fff;border-radius:22px;padding:28px 26px;border-top:10px solid #4B41E1;box-shadow:0 10px 30px rgba(9,20,38,.08)}
.step b{display:block;font-size:30px;margin-bottom:10px}.step span{font-size:25px;line-height:1.35;color:#3a4356}
.big{font-size:40px;line-height:1.4;max-width:1500px}
"""
def page(body):
    return f"<!doctype html><html lang='es'><head><meta charset='utf-8'><style>{CSS}</style></head><body>{body}</body></html>"
def foot(video,n,total):
    return f"<div class='foot'><span>Allocia · {html.escape(video)}</span><span>{n} / {total}</span></div>"
def run(cmd,**kw):
    r=subprocess.run(cmd,capture_output=True,text=True,**kw)
    if r.returncode!=0: print(r.stdout[-800:],r.stderr[-1200:]); raise SystemExit(f"fallo: {cmd[:3]}")
    return r.stdout
def main(specpath):
    spec=importlib.util.spec_from_file_location('spec',specpath); m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    name=m.NAME; slides=m.SLIDES; out=os.path.join(HERE,'out',name); os.makedirs(out,exist_ok=True)
    total=len(slides); segs=[]; total_dur=0; script=[]
    for i,s in enumerate(slides,1):
        body=s['body'] if s.get('raw') else f"<div class='slide {s.get('cls','')}'><div class='bar'></div>{s['body']}{foot(m.TITLE,i,total)}</div>"
        hp=os.path.join(out,f's{i:02d}.html'); open(hp,'w').write(page(body))
        png=os.path.join(out,f's{i:02d}.png')
        run([BROWSE,'goto','file://'+hp]); run([BROWSE,'viewport','1920x1080']); run([BROWSE,'wait','--load']); subprocess.run(['sleep','0.6']); run([BROWSE,'screenshot','--viewport',png])
        txt=os.path.join(out,f's{i:02d}.txt'); open(txt,'w').write(s['say'])
        m4a=os.path.join(out,f's{i:02d}.m4a')
        if os.environ.get('TTS','edge')=='edge':
            # Voz neuronal (Microsoft Edge TTS). «Allocia» se escribe «Alokia» solo para la pronunciación.
            spoken=s['say'].replace('Allocia','Alokia').replace('ALLOCIA','ALOKIA')
            mp3=os.path.join(out,f's{i:02d}.mp3')
            run([os.path.join(HERE,'tts','bin','edge-tts'),'--voice',os.environ.get('EDGE_VOICE','es-AR-TomasNeural'),'--rate',os.environ.get('EDGE_RATE','+8%'),'--text',spoken,'--write-media',mp3])
            run(['ffmpeg','-y','-loglevel','error','-i',mp3,'-af','apad=pad_dur=0.6','-c:a','aac','-b:a','128k',m4a])
        else:
            aiff=os.path.join(out,f's{i:02d}.aiff'); run(['say','-v',VOICE,'-r',RATE,'-o',aiff,'-f',txt])
            run(['ffmpeg','-y','-loglevel','error','-i',aiff,'-af','apad=pad_dur=0.6','-c:a','aac','-b:a','128k',m4a])
        dur=float(run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',m4a]).strip())
        seg=os.path.join(out,f's{i:02d}.mp4')
        run(['ffmpeg','-y','-loglevel','error','-loop','1','-framerate','30','-i',png,'-i',m4a,'-c:v','libx264','-preset','medium','-tune','stillimage','-pix_fmt','yuv420p','-r','30','-c:a','aac','-b:a','128k','-t',f'{dur:.2f}','-shortest',seg])
        segs.append(seg); total_dur+=dur; script.append((i,dur,s['say']))
        print(f"slide {i:02d} {dur:5.1f}s  acumulado {total_dur/60:4.2f} min")
    lst=os.path.join(out,'list.txt'); open(lst,'w').write(''.join(f"file '{p}'\n" for p in segs))
    final=os.path.join(HERE,'out',f'{name}.mp4')
    run(['ffmpeg','-y','-loglevel','error','-f','concat','-safe','0','-i',lst,'-c','copy','-movflags','+faststart',final])
    with open(os.path.join(HERE,'out',f'{name}_guion.md'),'w') as g:
        g.write(f"# {m.TITLE}\n\nDuración total: {total_dur/60:.1f} min\n\n")
        for i,d,t in script: g.write(f"## Diapositiva {i} ({d:.0f} s)\n\n{t}\n\n")
    print("FINAL",final,f"{total_dur/60:.2f} min")
if __name__=='__main__': main(sys.argv[1])
