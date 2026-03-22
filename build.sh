#!/bin/bash
# Build script for Render deployment

set -e

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Running database migrations..."
python backend/manage.py migrate --no-input

echo "Collecting static files..."
python backend/manage.py collectstatic --no-input

echo "Build complete!"
