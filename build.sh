#!/bin/bash

# Build script for Vercel deployment

echo "Starting build process..."

# Clean build directory
rm -rf .next

# Install dependencies
pnpm install --frozen-lockfile

# Run the build
pnpm build

# Check if build was successful
if [ $? -eq 0 ]; then
  echo "Build completed successfully"
  
  # List the .next directory structure for debugging
  echo "Build output structure:"
  find .next -type f -name "*manifest*" | head -20
  
else
  echo "Build failed"
  exit 1
fi
