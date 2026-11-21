@echo off
title Push EduBuddy Aura to GitHub
cd /d "%~dp0"
echo =================================================================
echo   Pushing EduBuddy Aura to GitHub (Kunal537-gif/edubuddy-aura-)
echo =================================================================
echo.
"C:\Program Files\Git\cmd\git.exe" push -u origin main
echo.
echo =================================================================
if %ERRORLEVEL% EQU 0 (
    echo   SUCCESS! Your project is now published on GitHub:
    echo   https://github.com/Kunal537-gif/edubuddy-aura-
) else (
    echo   Push encountered an error. If prompted, please authorize GitHub in your browser.
)
echo =================================================================
pause
