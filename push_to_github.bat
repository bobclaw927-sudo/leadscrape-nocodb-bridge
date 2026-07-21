@echo off
setlocal enabledelayedexpansion

set "REPO_DIR=C:\Users\Nicole\leadscrape-nocodb-bridge"
set "GITHUB_USER=bobclaw927-sudo"
set "REPO_NAME=leadscrape-nocodb-bridge"

cd /d "%REPO_DIR%"

REM Remove old .git if it exists (previous attempts had secret in history)
if exist ".git" (
    echo Removing old git history (contained a secret)...
    rd /s /q ".git"
)

echo.
echo ========================================
echo  LeadScrape -> NocoDB Webhook Deployer
echo ========================================
echo.
echo Enter your GitHub Personal Access Token
echo (will NOT be saved to disk):
set /p "PAT=> "

if "%PAT%"=="" (
    echo ERROR: PAT cannot be empty.
    pause
    exit /b 1
)

echo Initializing fresh git repository...
git init
git checkout -B main

echo Adding all files...
git add -A

echo Committing...
git commit -m "LeadScrape to NocoDB webhook bridge"

echo Setting up remote...
git remote add origin https://%PAT%@github.com/%GITHUB_USER%/%REPO_NAME%.git

echo Pushing to GitHub...
git push origin main --force

if errorlevel 1 (
    echo.
    echo FAILED. Check the error above.
    echo.
    pause
    exit /b 1
)

REM Clean PAT from remote URL
git remote set-url origin https://github.com/%GITHUB_USER%/%REPO_NAME%.git

echo.
echo ========================================
echo  SUCCESS: Code pushed to GitHub!
echo ========================================
echo.
echo Vercel will auto-deploy shortly.
echo Webhook URL: https://%REPO_NAME%.vercel.app/api/webhook
echo.
echo IMPORTANT: Revoke the old PAT at:
echo   https://github.com/settings/tokens
echo.
pause
