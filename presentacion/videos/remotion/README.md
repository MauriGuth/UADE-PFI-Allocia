# Videos de defensa generados con Remotion

Motion graphics dibujados por código, no diapositivas animadas. El plan visual, bloque por bloque, está en `STORYBOARD.md`.

- `src/core.tsx`: motor. Fichas persistentes, cámara, subtítulos palabra por palabra, foco sobre capturas y primitivas de dibujo.
- `src/v1.tsx`, `src/v2.tsx`, `src/v3.tsx`: una definición por escena. Cada acción se dispara con `at("palabra")`, que busca el tiempo real de esa palabra en la narración.
- `src/motion.json`: narración y tiempos por palabra, generados por `gen_motion.py` (voz es-MX-JorgeNeural de Edge TTS a +10 %; «Allocia» se pronuncia «Alokia»).
- `src/viab_series.json`: curvas mensuales de `scripts/viabilidad.py`, dibujadas a escala en el video 1.

Reglas verificadas: como máximo 4 palabras por escena además de los subtítulos (el texto solo sale de la lista `words` de cada escena) y ninguna palabra clave sin su palabra en la narración (`cues.py`).

Regenerar:
```bash
npm install
python3 -m venv tts && ./tts/bin/pip install edge-tts
# copiar a public/ las figuras y capturas
./tts/bin/python gen_motion.py
python3 cues.py
npx remotion render src/index.ts Video1 final/Video1.mp4
npx remotion render src/index.ts Video2 final/Video2.mp4
npx remotion render src/index.ts Video3 final/Video3.mp4
TARGET_MB=4.4 ./compress.sh
```
`stills.py Video1 1,2` arma una hoja de control con cuatro momentos por escena. Los MP4 de 1080p se suben a YouTube oculto o Google Drive; `compress.sh` los pasa a 720p con objetivo de tamaño fijo para el correo, por debajo de los 20 MB de Outlook una vez codificados en base64.
