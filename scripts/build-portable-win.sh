#!/bin/bash
# Builds a portable Windows package: a self-contained folder with a
# double-clickable launcher .exe, a bundled Node.js runtime, and the built
# app — no Node.js or npm install required on the target machine.
#
# Usage: bash scripts/build-portable-win.sh
# Output: dist/УчётСамозанятого-win.zip
set -euo pipefail
cd "$(dirname "$0")/.."

NODE_VERSION="22.22.2"
PKG_NAME="УчётСамозанятого"
OUT_DIR="dist/${PKG_NAME}"
FUSE="NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2"

echo "== 1/6 Собираю Next.js (standalone) =="
rm -rf .next dist
npm run build

echo "== 2/6 Собираю папку app =="
mkdir -p "$OUT_DIR/app"
cp -r .next/standalone/. "$OUT_DIR/app/"
rm -f "$OUT_DIR/app/.env"
rm -rf "$OUT_DIR/app/data"
mkdir -p "$OUT_DIR/app/.next"
cp -r .next/static "$OUT_DIR/app/.next/static"

echo "== 3/6 Готовлю пустую базу данных (со всеми таблицами) =="
mkdir -p "$OUT_DIR/app/prisma"
TEMPLATE_DB="$(mktemp -u).db"
DATABASE_URL="file:${TEMPLATE_DB}" npx prisma migrate deploy >/dev/null
cp "$TEMPLATE_DB" "$OUT_DIR/app/prisma/dev.db"
rm -f "$TEMPLATE_DB"

echo "== 4/6 Скачиваю портативный Node.js для Windows =="
mkdir -p "$OUT_DIR/node"
NODE_ZIP="$(mktemp)"
curl -sL -o "$NODE_ZIP" "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-win-x64.zip"
NODE_UNZIP_DIR="$(mktemp -d)"
unzip -q "$NODE_ZIP" -d "$NODE_UNZIP_DIR"
WIN_NODE_EXE="$NODE_UNZIP_DIR/node-v${NODE_VERSION}-win-x64/node.exe"
cp "$WIN_NODE_EXE" "$OUT_DIR/node/node.exe"

echo "== 5/6 Собираю Запустить.exe (Node single executable application) =="
SEA_DIR="$(mktemp -d)"
cp scripts/windows-launcher/launcher.js "$SEA_DIR/"
cat > "$SEA_DIR/sea-config.json" <<EOF
{ "main": "launcher.js", "output": "sea-prep.blob", "disableExperimentalSEAWarning": true }
EOF
(cd "$SEA_DIR" && node --experimental-sea-config sea-config.json)
cp "$WIN_NODE_EXE" "$OUT_DIR/Запустить.exe"
npx --yes postject "$OUT_DIR/Запустить.exe" NODE_SEA_BLOB "$SEA_DIR/sea-prep.blob" \
  --sentinel-fuse "$FUSE"

cp scripts/windows-launcher/README-package.txt "$OUT_DIR/ПРОЧТИ МЕНЯ.txt"

rm -rf "$NODE_UNZIP_DIR" "$SEA_DIR" "$NODE_ZIP"

echo "== 6/6 Упаковываю в zip =="
(cd dist && zip -rq -X "${PKG_NAME}-win.zip" "${PKG_NAME}")

echo
echo "Готово: dist/${PKG_NAME}-win.zip"
du -sh "dist/${PKG_NAME}-win.zip"
