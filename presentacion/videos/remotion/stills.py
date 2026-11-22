# Uso: stills.py Video1 [escenas]  ->  contact sheet por escena con 4 momentos (25, 50, 75 y final)
import json,sys,subprocess,os,math
v=sys.argv[1]; want=[int(x) for x in sys.argv[2].split(',')] if len(sys.argv)>2 else None
fr=[float(x) for x in (sys.argv[3].split(',') if len(sys.argv)>3 else ['.2','.45','.7','.97'])]
d=json.load(open('src/motion.json'))[v]['scenes']; a=0; jobs=[]
for s in d:
    if not want or s['n'] in want:
        for f in fr:
            jobs.append((s['n'],f,round((a+s['dur']*f)*30)))
    a+=s['dur']+.3
os.makedirs('out/st',exist_ok=True)
subprocess.run(['npx','remotion','bundle','src/index.ts','--out-dir=out/bundle','--log=error'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
procs=[]; files=[]
for i,(n,f,fr_) in enumerate(jobs):
    o=f'out/st/{v}_{n:02d}_{int(f*100):03d}.png'; files.append(o)
    procs.append(subprocess.Popen(['npx','remotion','still','out/bundle',v,f'--frame={fr_}',o,'--scale=0.5','--log=error'],stdout=subprocess.PIPE,stderr=subprocess.STDOUT))
    if len(procs)>=6:
        for p in procs:
            out=p.communicate()[0].decode()
            if 'rror' in out: print(out[-600:])
        procs=[]
for p in procs:
    out=p.communicate()[0].decode()
    if 'rror' in out: print(out[-600:])
cols=len(fr); rows=math.ceil(len(files)/cols)
w,h=480,270
inp=[]
for x in files: inp+=['-i',x]
lay='|'.join(f'{(i%cols)*w}_{(i//cols)*h}' for i in range(len(files)))
flt=';'.join(f'[{i}]scale={w}:{h}[s{i}]' for i in range(len(files)))+';'+''.join(f'[s{i}]' for i in range(len(files)))+f'xstack=inputs={len(files)}:layout={lay}'
out=f'out/check/{v}_{"-".join(map(str,want)) if want else "all"}.png'
subprocess.run(['ffmpeg','-y','-loglevel','error',*inp,'-filter_complex',flt,out],check=True); print(out)
