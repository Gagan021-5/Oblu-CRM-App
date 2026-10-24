#!/usr/bin/env bash
# =============================================================================
# ObluMerge Initial Server Setup Script (Ubuntu 22.04 / 24.04 LTS)
# Run once on your newly provisioned VPS / EC2 / Droplet:
#   sudo bash setup_server.sh
# =============================================================================

set -e

echo "==> 1. Updating packages and installing prerequisites..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3-pip python3-venv python3-dev build-essential libpq-dev libxml2-dev libxslt1-dev unixodbc postgresql postgresql-contrib nginx git curl libgl1-mesa-glx libglib2.0-0

echo "==> 2. Setting up project directory..."
sudo mkdir -p /var/www/Oblu-CRM-App
sudo chown -R $USER:www-data /var/www/Oblu-CRM-App
sudo chmod -R 775 /var/www/Oblu-CRM-App

echo "==> 3. Instructions for clone and initial environment:"
echo "  Run:"
echo "    cd /var/www/Oblu-CRM-App"
echo "    git clone https://github.com/Gagan021-5/Oblu-CRM-App.git ."
echo "    cd ObluMerge"
echo "    python3 -m venv venv"
echo "    source venv/bin/activate"
echo "    pip install -r requirements.txt"
echo "    cp deploy/oblumerge.service /etc/systemd/system/oblumerge.service"
echo "    sudo systemctl daemon-reload"
echo "    sudo systemctl enable --now oblumerge.service"
echo "    sudo cp deploy/nginx.conf /etc/nginx/sites-available/oblumerge"
echo "    sudo ln -s /etc/nginx/sites-available/oblumerge /etc/nginx/sites-enabled/"
echo "    sudo nginx -t && sudo systemctl restart nginx"
