#!/bin/bash

# Create the destination directory if it doesn't exist
if mkdir -p ./src/tinymce; then
    echo "./src/tinymce directory created."
else
    echo "Failed to create ./src/tinymce directory. Exiting."
    exit 1
fi

# Verify the destination is indeed a directory
if [ -d "./src/tinymce" ]; then
    echo "./src/tinymce is a valid directory."
else
    echo "./src/tinymce is not a directory. Exiting."
    exit 1
fi

# Download the latest TinyMCE self-hosted package
echo "Downloading latest TinyMCE package..."
if curl -L https://download.tiny.cloud/tinymce/community/tinymce_latest.zip -o tinymce_latest.zip; then
    echo "Download complete."
else
    echo "Download failed. Exiting."
    exit 1
fi

# Unzip the package
echo "Extracting TinyMCE package..."
if unzip -q tinymce_latest.zip -d tinymce_temp; then
    echo "Extraction complete."
else
    echo "Failed to extract TinyMCE package. Exiting."
    rm -f tinymce_latest.zip
    exit 1
fi

# Move the contents to the destination directory
echo "Moving files to ./src/tinymce..."
if mv tinymce_temp/tinymce/* ./src/tinymce/; then
    echo "Files moved successfully."
else
    echo "Failed to move files. Exiting."
    rm -rf tinymce_temp tinymce_latest.zip
    exit 1
fi

# Clean up temporary files
echo "Cleaning up..."
rm -rf tinymce_temp tinymce_latest.zip

echo "TinyMCE has been successfully installed in ./src/tinymce"
