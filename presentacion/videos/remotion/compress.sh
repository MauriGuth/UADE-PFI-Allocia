#!/bin/zsh
# Comprime los masters 1080p a 720p con objetivo de tamaño fijo (dos pasadas) para que los tres
# adjuntos, ya codificados en base64 por el correo, entren en el límite de 20 MB de Outlook.
cd "$(dirname "$0")"
mkdir -p ../adjuntos ../masters out/cmp
typeset -A names
names=(Video1 "01 - Problema investigacion y propuesta" Video2 "02 - Arquitectura implementacion y pruebas" Video3 "03 - Allocia explicada")
TARGET_MB=${TARGET_MB:-4.6}
AUDIO_K=32
for v in Video1 Video2 Video3; do
  cp final/$v.mp4 "../masters/${names[$v]}.mp4"
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 final/$v.mp4)
  vk=$(python3 -c "print(int($TARGET_MB*8*1024*0.97/$dur-$AUDIO_K))")
  echo "$v video ${vk}k"
  ffmpeg -y -loglevel error -i final/$v.mp4 -vf "scale=1280:720:flags=lanczos,fps=24" -c:v libx264 -preset veryslow -tune animation -g 240 -b:v ${vk}k -pass 1 -passlogfile out/cmp/$v -an -f null /dev/null
  ffmpeg -y -loglevel error -i final/$v.mp4 -vf "scale=1280:720:flags=lanczos,fps=24" -c:v libx264 -preset veryslow -tune animation -g 240 -b:v ${vk}k -pass 2 -passlogfile out/cmp/$v -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a ${AUDIO_K}k -ac 1 "../adjuntos/${names[$v]}.mp4"
done
ls -la ../adjuntos
du -ch ../adjuntos/*.mp4 | tail -1
