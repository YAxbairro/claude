@echo off
rem Abre o VeloDown e a interface no browser
cd /d "%~dp0"
where pythonw >nul 2>nul && (start "" pythonw -m velodown serve --open) || (python -m velodown serve --open)
