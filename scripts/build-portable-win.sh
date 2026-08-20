#!/bin/bash
# Builds a portable Windows package: a self-contained folder with a
# double-clickable launcher (no console window) and a bundled Node.js
# runtime — no Node.js install or npm install required on the target
# machine at all.
#
# Usage: bash scripts/build-portable-win.sh
# Output: dist/УчётСамозанятого-win.zip
set -euo pipefail
cd "$(dirname "$0")/.."

NODE_VERSION="22.22.2"
PKG_NAME="УчётСамозанятого"
OUT_DIR="dist/${PKG_NAME}"

echo "== 1/5 Собираю Next.js (standalone) =="
rm -rf .next dist
npm run build

echo "== 2/5 Собираю папку app =="
mkdir -p "$OUT_DIR/app"
cp -r .next/standalone/. "$OUT_DIR/app/"
rm -f "$OUT_DIR/app/.env"
rm -rf "$OUT_DIR/app/data"
mkdir -p "$OUT_DIR/app/.next"
cp -r .next/static "$OUT_DIR/app/.next/static"

echo "== 3/5 Готовлю пустую базу данных (со всеми таблицами) =="
mkdir -p "$OUT_DIR/app/prisma"
TEMPLATE_DB="$(mktemp -u).db"
DATABASE_URL="file:${TEMPLATE_DB}" npx prisma migrate deploy >/dev/null
cp "$TEMPLATE_DB" "$OUT_DIR/app/prisma/dev.db"
rm -f "$TEMPLATE_DB"

echo "== 4/5 Скачиваю портативный Node.js для Windows (только node.exe) =="
mkdir -p "$OUT_DIR/node"
NODE_ZIP="$(mktemp)"
curl -sL -o "$NODE_ZIP" "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-win-x64.zip"
NODE_UNZIP_DIR="$(mktemp -d)"
unzip -q "$NODE_ZIP" -d "$NODE_UNZIP_DIR"
cp "$NODE_UNZIP_DIR/node-v${NODE_VERSION}-win-x64/node.exe" "$OUT_DIR/node/node.exe"
rm -rf "$NODE_UNZIP_DIR" "$NODE_ZIP"

echo "== 5/5 Кладу launcher.js, Запустить.vbs, Остановить.bat, инструкцию =="
cp scripts/windows-launcher/launcher.js "$OUT_DIR/launcher.js"
cp scripts/windows-launcher/Запустить.vbs "$OUT_DIR/Запустить.vbs"
cp scripts/windows-launcher/Остановить.bat "$OUT_DIR/Остановить.bat"
cp scripts/windows-launcher/README-package.txt "$OUT_DIR/ПРОЧТИ МЕНЯ.txt"

echo "== Упаковываю в zip =="
(cd dist && zip -rq -X "${PKG_NAME}-win.zip" "${PKG_NAME}")

echo
echo "Готово: dist/${PKG_NAME}-win.zip"
du -sh "dist/${PKG_NAME}-win.zip"
du -sh "$OUT_DIR"
