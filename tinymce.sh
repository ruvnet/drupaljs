#!/bin/bash

# Create the destination directory if it doesn't exist
mkdir -p /src/tinymce

# Download the latest TinyMCE self-hosted package
echo "Downloading latest TinyMCE package..."
curl -L https://download.tiny.cloud/tinymce/community/tinymce_latest.zip -o tinymce_latest.zip

# Unzip the package
echo "Extracting TinyMCE package..."
unzip -q tinymce_latest.zip -d tinymce_temp

# Move the contents to the destination directory
echo "Moving files to /src/tinymce..."
mv tinymce_temp/tinymce/* /src/tinymce/

# Clean up temporary files
echo "Cleaning up..."
rm -rf tinymce_temp tinymce_latest.zip

echo "TinyMCE has been successfully installed in /src/tinymce"
