#!/bin/bash

# Create images directory if it doesn't exist
mkdir -p ../images

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Generate PNG icons in different sizes using magick
magick convert -background none -resize 16x16 "$SCRIPT_DIR/icon.svg" "$SCRIPT_DIR/../images/icon16.png"
magick convert -background none -resize 48x48 "$SCRIPT_DIR/icon.svg" "$SCRIPT_DIR/../images/icon48.png"
magick convert -background none -resize 128x128 "$SCRIPT_DIR/icon.svg" "$SCRIPT_DIR/../images/icon128.png"
