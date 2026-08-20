@echo off
chcp 65001 >nul
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js не найден на этом компьютере.
  echo Установите его один раз ^(бесплатно, минуты 2^): https://nodejs.org
  echo Скачайте версию LTS, установите с настройками по умолчанию,
  echo затем запустите этот файл ещё раз.
  echo.
  pause
  exit /b 1
)

node scripts\win-launcher.js
pause
