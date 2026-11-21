@echo off
title EduBuddy Aura - AI Learning Platform
cd /d "%~dp0"
echo =================================================================
echo   EduBuddy Aura - AI-Powered Student Learning Platform
echo =================================================================
echo.
echo Starting FastAPI application server...
python run_server.py
pause
