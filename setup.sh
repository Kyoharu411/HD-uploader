#!/bin/sh
# Jalankan sekali di folder ini (butuh npm + internet)
set -e
mkdir -p lib && cd lib
npm init -y >/dev/null 2>&1
npm i @ffmpeg/ffmpeg@0.12.10 @ffmpeg/util@0.12.1 @ffmpeg/core@0.12.6
cp node_modules/@ffmpeg/ffmpeg/dist/umd/ffmpeg.js node_modules/@ffmpeg/ffmpeg/dist/umd/814.ffmpeg.js .
cp node_modules/@ffmpeg/util/dist/umd/index.js util.js
cp node_modules/@ffmpeg/core/dist/umd/ffmpeg-core.js node_modules/@ffmpeg/core/dist/umd/ffmpeg-core.wasm .
rm -rf node_modules package.json package-lock.json
echo "Selesai. Isi lib/:"; ls
