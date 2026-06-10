@echo off
:: 2025-11-29 uni
:: 2026-06-10 uni
title tripfarecalc deployment
color 03

pm2 delete tripfarecalc-app

echo ---- Pulling ----
git pull

echo ---- Generate db files ----
npx prisma generate

echo ---- Building ----
call _deploy.bat

echo ---- Starting the app ----
pm2 start

echo ---- Done ----
pause>nul