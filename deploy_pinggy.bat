@echo off
title EduBuddy Aura - Pinggy Public HTTPS URL
cd /d "%~dp0"
echo =================================================================
echo   EduBuddy Aura - Instant Public Live URL (via Pinggy HTTPS)
echo =================================================================
echo.
ssh -p 443 -R0:localhost:8000 a.pinggy.io
pause
