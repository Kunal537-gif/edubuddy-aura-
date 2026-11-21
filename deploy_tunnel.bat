@echo off
title EduBuddy Aura - Instant Public Live Tunnel
cd /d "%~dp0"
echo =================================================================
echo   EduBuddy Aura - Instant Public HTTPS Deployment (Live URL)
echo =================================================================
echo.
echo Connecting local server to public secure tunnel...
echo Anyone anywhere in the world will be able to access your app!
echo.
echo Keep this window open to keep the public URL live.
echo.
ssh -R 80:localhost:8000 nokey@localhost.run
pause
