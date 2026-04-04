@echo off
title LocalShare
cd /d "%~dp0"

:: Vérifie que Python est installé
python --version >nul 2>&1
if errorlevel 1 (
    echo Python est introuvable sur cette machine.
    echo Installe-le depuis https://python.org en cochant bien "Add Python to PATH".
    pause
    exit /b
)

:: Ouvre le navigateur après 1.5s (laisse le temps au serveur de démarrer)
start "" cmd /c "timeout /t 2 >nul && start http://localhost:5000"

:: Lance le serveur
python main.py
pause
