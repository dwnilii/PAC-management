#!/bin/bash

# PAC-Management Safe Update Script
# This script updates the application from Git without overwriting user data.

# --- Configuration ---
INSTALL_DIR=$(pwd) # Assumes the script is run from the project root
PM2_APP_NAME="pac-management"

# --- Colors for output ---
C_RESET='\033[0m'
C_GREEN='\033[0;32m'
C_YELLOW='\033[0;33m'
C_BLUE='\033[0;34m'

# --- Helper Functions ---
print_info() {
    echo -e "${C_BLUE}[INFO] $1${C_RESET}"
}
print_success() {
    echo -e "${C_GREEN}[SUCCESS] $1${C_RESET}"
}
print_warning() {
    echo -e "${C_YELLOW}[WARNING] $1${C_RESET}"
}

# Ensure we are in the correct directory
cd "$INSTALL_DIR" || exit 1
echo "--- Running in $(pwd) ---"

# --- Main Update Logic ---

# 1. Fetch latest changes from Git
print_info "Fetching latest code from GitHub..."
git fetch origin main
if [ $? -ne 0 ]; then
    print_warning "git fetch failed. Trying to continue..."
fi

# 2. Check for local changes
if [[ -n $(git status -s) ]]; then
  print_warning "You have local changes. Stashing them..."
  git stash
  if [ $? -ne 0 ]; then
      echo "Failed to stash changes. Aborting."
      exit 1
  fi
fi


# 3. Pull the latest code from the 'main' branch
print_info "Pulling latest changes from the 'main' branch..."
git pull origin main
if [ $? -ne 0 ]; then
    echo "git pull failed. Aborting update."
    exit 1
fi

# 4. Install/update npm dependencies
print_info "Installing/updating project dependencies with npm..."
npm install
if [ $? -ne 0 ]; then
    echo "npm install failed. Aborting update."
    exit 1
fi

# 5. Build the Next.js application
print_info "Building the application for production..."
npm run build
if [ $? -ne 0 ]; then
    echo "npm run build failed. Aborting update."
    exit 1
fi

# 6. Restart the application with PM2
print_info "Restarting the application with PM2..."
# 'reload' is graceful, 'restart' is faster. Using restart as it's safer for build changes.
pm2 restart "$PM2_APP_NAME"
if [ $? -ne 0 ]; then
    echo "Failed to restart the application with PM2. Please check PM2 status manually."
    exit 1
fi

print_success "Update complete! The application has been updated and restarted."

exit 0
