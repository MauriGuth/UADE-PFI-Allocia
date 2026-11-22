# Verifica que cada palabra clave exista en la narración de su escena.
import json,re,sys,unicodedata
def norm(s):
    s=unicodedata.normalize('NFD',s.lower()); s=''.join(c for c in s if unicodedata.category(c)!='Mn')
    return re.sub(r'[^a-z0-9 ]','',s)
d=json.load(open('src/motion.json')); bad=0
for vf,vid in [('src/v1.tsx','Video1'),('src/v2.tsx','Video2'),('src/v3.tsx','Video3')]:
    src=open(vf).read()
    parts=re.split(r'\nconst s(\d+): SceneDef',src)
    extra={}
    for i in range(1,len(parts),2):
        n=int(parts[i]); body=parts[i+1]
        ws=' '.join(norm(w['w']) for w in d[vid]['scenes'][n-1]['words'])
        words=' '+re.sub(r' +',' ',ws)+' '
        qs=re.findall(r'\bat\("([^"]+)"(?:,\s*(\d+))?\)',body)
        for q,occ in qs:
            nq=' '+norm(q)+' '; c=words.count(nq)
            if c<int(occ or 1): print(vid,n,repr(q),occ,'NOT FOUND'); bad+=1
print('bad',bad)
