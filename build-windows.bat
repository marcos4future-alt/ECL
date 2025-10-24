@echo off
echo ========================================
echo Document Analyzer - Windows Build Script
echo ========================================
echo.

echo Step 1: Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please download and install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js found:
node --version
echo.

echo Step 2: Installing dependencies...
echo This may take 5-10 minutes on first run...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo.

echo Step 3: Building portable Windows executable...
echo This may take 5-10 minutes...
call npm run build:portable
if errorlevel 1 (
    echo ERROR: Build failed
    pause
    exit /b 1
)
echo.

echo ========================================
echo BUILD SUCCESSFUL!
echo ========================================
echo.
echo Your executable is ready:
echo Location: dist\Document Analyzer *.exe
echo Size: ~150-200 MB
echo.
echo You can now distribute this file to users.
echo No installation required - just run the .exe!
echo.
dir /b dist\*.exe
echo.
pause
