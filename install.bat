@echo off
title LocalShare - Installation
cls

echo.
echo   ===========================================
echo            Bienvenue dans LocalShare         
echo   ===========================================
echo.

:: -- Vérifie que Python est installé ------------------------------------------
python --version >nul 2>&1
if errorlevel 1 (
    powershell -Command "Add-Type -AssemblyName PresentationFramework; [System.Windows.MessageBox]::Show('Python est introuvable sur cette machine.`n`nInstalle-le depuis https://python.org en cochant bien `"Add Python to PATH`".', 'LocalShare — Erreur', 'OK', 'Error')"
    exit /b
)

:: -- Vérifie que config.py.example existe -------------------------------------
if not exist "%~dp0config.py.example" (
    echo Fichier config.py.example introuvable.
    echo Assure-toi d'etre dans le bon dossier.
    pause
    exit /b
)

:: -- Choix de la configuration -------------------------------------------------
echo   Choisissez une option de configuration :
echo.
echo   [D] Configuration par defaut
echo       PORT     : 5000
echo       Dossier  : %USERPROFILE%\Downloads\LocalShare\files
echo.
echo   [M] Configuration manuelle
echo.
set /p CONFIG_CHOICE="   Votre choix (D/M) : "

if /i "%CONFIG_CHOICE%"=="D" goto DEFAULT_CONFIG
if /i "%CONFIG_CHOICE%"=="M" goto MANUAL_CONFIG

echo Choix invalide. Relance le script et choisis D ou M.
pause
exit /b

:: -- Configuration par défaut --------------------------------------------------
:DEFAULT_CONFIG
set PORT=5000
set UPLOAD_DIR=%USERPROFILE%\Downloads\LocalShare\files
goto WRITE_CONFIG

:: -- Configuration manuelle ---------------------------------------------------
:MANUAL_CONFIG
echo.
echo   Configuration manuelle
echo   (Appuie sur Entree pour garder la valeur conseillee)
echo.

set /p PORT="   PORT (conseille : 5000) : "
if "%PORT%"=="" set PORT=5000

set DEFAULT_PATH=%USERPROFILE%\Downloads\LocalShare\files
set /p UPLOAD_DIR="   Dossier de stockage (conseille : %DEFAULT_PATH%) : "
if "%UPLOAD_DIR%"=="" set UPLOAD_DIR=%DEFAULT_PATH%

goto WRITE_CONFIG

:: -- Génère config.py ----------------------------------------------------------
:WRITE_CONFIG
echo.
echo   Generation de config.py...

:: Remplace les antislashes simples par doubles pour Python
set UPLOAD_DIR_PY=%UPLOAD_DIR:\=\\%

(
    echo from pathlib import Path
    echo.
    echo # -- Serveur ------------------------------------------------------------------
    echo PORT = %PORT%
    echo.
    echo # -- Stockage -----------------------------------------------------------------
    echo UPLOAD_DIR = Path^(r"%UPLOAD_DIR%"^)
    echo UPLOAD_DIR.mkdir^(parents=True, exist_ok=True^)
    echo.
    echo # -- Interface ----------------------------------------------------------------
    echo STATIC_DIR = Path^(__file__^).parent / "static"
) > "%~dp0config.py"

echo   config.py genere avec succes !

:: -- Crée le raccourci sur le bureau ------------------------------------------
echo   Creation du raccourci sur le bureau...

:: Supprime l'ancien raccourci s'il existe
if exist "%USERPROFILE%\Desktop\LocalShare.lnk" del "%USERPROFILE%\Desktop\LocalShare.lnk"

powershell -Command ^
    "$ws = New-Object -ComObject WScript.Shell;" ^
    "$s = $ws.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\LocalShare.lnk');" ^
    "$s.TargetPath = '%~dp0LocalShare.bat';" ^
    "$s.IconLocation = '%~dp0LocalShare-icon.ico';" ^
    "$s.WorkingDirectory = '%~dp0';" ^
    "$s.Save()"

echo   Raccourci cree sur le bureau !

:: -- Résumé --------------------------------------------------------------------
echo.
echo   ===========================================
echo              Installation terminee !
echo   ===========================================
echo.
echo   PORT     : %PORT%
echo   Dossier  : %UPLOAD_DIR%
echo.
echo   Pour lancer LocalShare :
echo   - Double-clique sur le raccourci du bureau
echo   - Ou relance LocalShare.bat directement
echo.

:: -- Proposition de lancement -------------------------------------------------
set /p LAUNCH="   Lancer LocalShare maintenant ? (O/N) : "
if /i "%LAUNCH%"=="O" (
    start "" "%~dp0LocalShare.bat"
)

exit /b
