@echo off
chcp 65001 >nul
cd /d "%~dp0"

if not exist server.pid (
  echo Программа сейчас не запущена.
  pause
  exit /b 0
)

set /p PID=<server.pid
taskkill /PID %PID% /T /F >nul 2>nul
del /q server.pid >nul 2>nul

echo Программа остановлена. Это окно можно закрыть.
pause
