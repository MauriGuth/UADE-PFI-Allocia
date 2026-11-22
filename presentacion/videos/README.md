# Videos de defensa (entrega hasta el 10 de noviembre de 2026)

Tres videos de ~5 minutos, 1920×1080, H.264 + AAC, animados por código con Remotion (ver `remotion/README.md` y `remotion/STORYBOARD.md`), con subtítulos sincronizados y narración con voz neuronal masculina es-MX-JorgeNeural (Microsoft Edge TTS); en la narración «Allocia» se pronuncia «Alokia». Los MP4 no se versionan; están en `~/Documents/UADE_PFI/videos/`.

| Video | Contenido | Duración |
|---|---|---|
| `video1_problema_y_propuesta.mp4` | Problema, encuesta y entrevistas, estado del arte, propuesta, alcance web + móvil, requerimientos, modelo de negocio y viabilidad (análogo a la defensa del 50 %). | 4:54 |
| `video2_arquitectura_y_pruebas.mp4` | Arquitectura, recorrido de la información, motor de reglas, capa de IA, seguridad y marco legal, Scrum/Kanban, pruebas, resultados frente a objetivos (análogo a la defensa del 75 %). | 4:59 |
| `video3_allocia_explicada.mp4` | El producto de principio a fin, sin tecnicismos; pensado también para la presentación presencial. | 4:48 |

Los guiones están en `*_guion.md`, con la duración de cada diapositiva, para grabar la voz propia encima si se prefiere.

## Regenerar

La versión vigente se regenera desde `remotion/`. Lo siguiente corresponde a la primera versión, con diapositivas HTML:

Requiere ffmpeg, edge-tts (voz neuronal; alternativa local: TTS=say con la voz de macOS) y un navegador headless indicado en la variable de entorno `BROWSE`. Los activos (figuras renderizadas del informe y capturas) se generan desde `figures/` del repo.

```bash
python3 -m venv tts && ./tts/bin/pip install edge-tts
EDGE_VOICE=es-AR-TomasNeural EDGE_RATE=+4% python3 build.py spec_video1c.py
```

Para reemplazar la voz sintética por una grabación propia: grabar un audio por diapositiva siguiendo el guion y sustituir `out/<video>/sNN.m4a` antes del paso de concatenación, o reemplazar la pista completa con `ffmpeg -i video.mp4 -i voz.m4a -map 0:v -map 1:a -c:v copy -shortest final.mp4`.
