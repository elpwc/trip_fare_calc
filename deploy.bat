@echo off
:: 2025-11-29 uni
:: 2026-06-10 uni
title tripfarecalc deployment
color 03
echo ---- Pulling from git repo ----
git pull

echo ---- Building the project ----
call _deploy.bat

echo ---- Restarting the app ----
pm2 delete tripfarecalc-app
pm2 start

echo ---- Done ----
pause>nul