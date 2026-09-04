@echo off
chcp 65001 >nul
cd /d "%~dp0"
title ImoAuto

where py >nul 2>nul
if %errorlevel%==0 (
    py -3 arrancar.py
    goto fim
)

where python >nul 2>nul
if %errorlevel%==0 (
    python arrancar.py
    goto fim
)

echo.
echo   ============================================================
echo     Falta instalar o Python (e o robo precisa dele)
echo   ============================================================
echo.
echo     1. Vai a:  https://www.python.org/downloads/
echo     2. Carrega no botao amarelo grande "Download Python"
echo     3. Abre o ficheiro que descarregou
echo     4. IMPORTANTE: no instalador, marca a caixa em baixo que
echo        diz "Add python.exe to PATH" ANTES de carregar Install
echo     5. Quando acabar, volta a abrir este ARRANCAR
echo.
echo     E gratuito e demora dois minutos.
echo.

:fim
echo.
pause
