@echo off
setlocal enabledelayedexpansion

set "REPO_DIR=C:\Users\Nicole\leadscrape-nocodb-bridge"
set "GITHUB_USER=bobclaw927-sudo"
set "REPO_NAME=leadscrape-nocodb-bridge"
set "PAT=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"

cd /d "%REPO_DIR%"

if not exist ".git" (
    echo Initializing git repository...
    git init
)

REM Always force the local branch to be 'main'
echo Checking out main branch...
git checkout -B main >nul 2>&1

echo Adding all files...
git add -A >nul 2>&1

echo Committing...
git commit -m "Full project with CommonJS fix for Vercel" >nul 2>&1
if errorlevel 1 (
    echo Nothing new to commit, continuing with existing commits...
)

echo Setting up remote with PAT...
git remote remove origin >nul 2>&1
git remote add origin https://%PAT%@github.com/%GITHUB_USER%/%REPO_NAME%.git

echo Force pushing to GitHub...
git push origin main --force

if errorlevel 1 (
    echo.
    echo FAILED. Check the error above.
    echo.
    pause
    exit /b 1
)

echo Cleaning up PAT from remote...
git remote set-url origin https://github.com/%GITHUB_USER%/%REPO_NAME%.git

echo.
echo ========================================
echo  SUCCESS: Code pushed to GitHub!
echo ========================================
echo.
echo Vercel will auto-deploy shortly.
echo Webhook URL: https://%REPO_NAME%.vercel.app/api/webhook
echo.
echo IMPORTANT: Revoke your PAT at:
echo   https://github.com/settings/tokens
echo.
pause
