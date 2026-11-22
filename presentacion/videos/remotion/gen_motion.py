# Genera la narración (voz es-MX-JorgeNeural, +10 %) y los tiempos palabra por palabra de cada escena.
import asyncio, json, os, re, subprocess, unicodedata
import edge_tts
FIX = {("Video2", 9): ("los inversores activos explicaron una observación sin ayuda; los perfiles sin experiencia necesitaron orientación,",
                       "dos inversores activos explicaron una observación sin ayuda; los demás necesitaron orientación,")}
def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    return re.sub(r"[^a-z0-9]", "", "".join(c for c in s if unicodedata.category(c) != "Mn"))
async def scene(text, mp3):
    spoken = text.replace("Allocia", "Alokia")
    c = edge_tts.Communicate(spoken, "es-MX-JorgeNeural", rate="+10%", boundary="WordBoundary")
    bounds = []
    with open(mp3, "wb") as f:
        async for ch in c.stream():
            if ch["type"] == "audio": f.write(ch["data"])
            elif ch["type"] == "WordBoundary": bounds.append((ch["offset"]/1e7, (ch["offset"]+ch["duration"])/1e7, ch["text"]))
    # Alineación por posición de caracteres: cada palabra del guion recibe su propio tiempo.
    toks = text.split()
    spans, cur = [], ""
    for tk in toks:
        n = norm(tk.replace("Allocia", "Alokia")); spans.append((len(cur), len(cur) + len(n))); cur += n
    marks = []  # (posición de carácter, t0, t1)
    ptr = 0
    for t0, t1, b in bounds:
        tgt = norm(b)
        if not tgt: continue
        i = cur.find(tgt, ptr)
        if i < 0 or i - ptr > 60: continue
        marks.append((i, i + len(tgt), t0, t1)); ptr = i + len(tgt)
    def time_at(pos):
        for a0, a1, t0, t1 in marks:
            if a0 <= pos < a1: return t0 + (t1 - t0) * (pos - a0) / max(1, a1 - a0)
        prev = [m for m in marks if m[1] <= pos]; nxt = [m for m in marks if m[0] > pos]
        if prev and nxt: return prev[-1][3]
        return prev[-1][3] if prev else (nxt[0][2] if nxt else 0.0)
    words = []
    for tk, (a0, a1) in zip(toks, spans):
        words.append({"w": tk, "t0": round(time_at(a0), 3), "t1": round(time_at(max(a0, a1 - 1)) + 0.05, 3)})
    return words
async def main():
    d = json.load(open("src/scenes.json")); out = {}
    for k, v in d.items():
        scenes = []
        for s in v["scenes"]:
            text = s["say"]
            if (k, s["n"]) in FIX:
                a, b = FIX[(k, s["n"])]; assert a in text; text = text.replace(a, b)
            mp3 = os.path.join("public", s["audio"])
            words = await scene(text, mp3)
            dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp3]).decode().strip())
            scenes.append({"n": s["n"], "say": text, "audio": s["audio"], "dur": round(dur, 2), "words": words})
            print(k, s["n"], dur, len(words), flush=True)
        out[k] = {"id": v["id"], "title": v["title"], "scenes": scenes}
    json.dump(out, open("src/motion.json", "w"), ensure_ascii=False)
asyncio.run(main())
