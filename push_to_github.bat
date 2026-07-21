@echo off
cd /d "C:\Users\Nicole\leadscrape-nocodb-bridge"

:: Initialize git if not already a repo
if not exist ".git" (
    echo Initializing git repository...
    git init
    git branch -M main
)

:: Set remote URL with authentication
git remote remove origin 2>nul
git remote add origin https://bobclaw927-sudo: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@github.com/bobclaw927-sudo/leadscrape-nocodb-bridge.git

:: Add all files
echo Adding files...
git add -A

:: Commit
echo Committing...
git commit -m "Full project with CommonJS fix for Vercel"

:: Push
echo Pushing to GitHub...
git push -u origin main

:: Clean the PAT from remote URL after push
git remote set-url origin https://github.com/bobclaw927-sudo/leadscrape-nocodb-bridge.git

echo.
if %errorlevel% equ 0 (
    echo SUCCESS: Code pushed! Vercel will auto-deploy.
) else (
    echo FAILED. Check the error above.
)
echo.
pause
