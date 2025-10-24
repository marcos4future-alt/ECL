#!/bin/bash

echo "========================================"
echo "Document Analyzer - Build Script"
echo "========================================"
echo ""

echo "Step 1: Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please install Node.js v16+ from https://nodejs.org/"
    exit 1
fi
echo "Node.js found: $(node --version)"
echo ""

echo "Step 2: Installing dependencies..."
echo "This may take 5-10 minutes on first run..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies"
    exit 1
fi
echo ""

echo "Step 3: Building Windows executable..."
echo "This may take 5-10 minutes..."
npm run build
if [ $? -ne 0 ]; then
    echo "ERROR: Build failed"
    exit 1
fi
echo ""

echo "========================================"
echo "BUILD SUCCESSFUL!"
echo "========================================"
echo ""
echo "Your Windows executable is ready:"
echo "Location: dist/"
ls -lh dist/*.exe 2>/dev/null || echo "Check dist/ folder for output"
echo ""
echo "You can now distribute this file to users."
echo "No installation required - just run the .exe!"
echo ""
