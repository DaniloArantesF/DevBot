#!/bin/bash

# Get current absolute path
SCRIPT=$(readlink -f "$0")
SCRIPTPATH=$(dirname "$SCRIPT")

# Clean up
echo "Cleaning up..."
$(. $SCRIPTPATH/clean.sh)

# Build
echo "Building..."
. $SCRIPTPATH/build.sh

# Deploy
echo "Deploying..."
. $SCRIPTPATH/deploy.sh