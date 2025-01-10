#!/bin/bash
# build.sh

# Create dist directory
mkdir -p dist/static/js
mkdir -p dist/static/images

# Copy static files
cp -R static/js/* dist/static/js/
cp -R static/images/* dist/static/images/

# Copy root files
cp index.html manifest.json _headers _redirects dist/

# Verify files
echo "Build completed. Verifying files..."
ls -R dist/
