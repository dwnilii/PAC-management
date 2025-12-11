#!/bin/bash

# PAC-Management Installer Script
# This script automates the installation of the PAC-Management panel on a Debian/Ubuntu server.

# --- Configuration ---
REPO_URL="https://github.com/dwnilii/PAC-Management.git"
INSTALL_DIR="/opt/PAC-Management" # Changed to /opt/
PM2_APP_NAME="pac-management"
NODE_VERSION="18" # Required Node.js version
PAC_DIR="/var/www/html/pac" # Base directory for PAC files

# --- Colors for output ---
C_RESET='\033[0m'
C_RED='\033[0;31m'
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

print_error() {
    echo -e "${C_RED}[ERROR] $1${C_RESET}"
    exit 1
}

# --- Main Installation Logic ---

# 1. Check for root privileges
if [ "$EUID" -ne 0 ]; then
    print_error "This script must be run as root. Please use 'sudo'."
fi

# 2. Install necessary dependencies (curl, git)
print_info "Installing dependencies (curl, git)..."
apt-get install -y curl git || print_error "Failed to install essential dependencies."

# 3. Install Node.js and npm
print_info "Checking for Node.js..."
if ! command -v node &> /dev/null || [[ $(node -v | cut -d'v' -f2 | cut -d'.' -f1) -lt $NODE_VERSION ]]; then
    print_info "Node.js not found or version is too old. Installing Node.js v$NODE_VERSION..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    apt-get install -y nodejs || print_error "Failed to install Node.js."
else
    print_success "Node.js is already installed and meets version requirements."
fi

# 4. Install PM2 process manager
print_info "Checking for PM2..."
if ! npm list -g --depth=0 | grep -q pm2; then
    print_info "Installing PM2 globally..."
    npm install pm2 -g || print_error "Failed to install PM2."
else
    print_success "PM2 is already installed."
fi

# 5. Clone the repository
if [ -d "$INSTALL_DIR" ]; then
    print_warning "Directory '$INSTALL_DIR' already exists. Pulling latest changes..."
    cd "$INSTALL_DIR"
    git pull origin main || print_warning "Could not pull latest changes."
else
    print_info "Cloning the PAC-Management repository into $INSTALL_DIR..."
    git clone "$REPO_URL" "$INSTALL_DIR" || print_error "Failed to clone repository."
fi

cd "$INSTALL_DIR" || print_error "Failed to enter the installation directory: $INSTALL_DIR"

# 6. Create .env file
if [ -f ".env" ]; then
    print_success ".env file already exists."
else
    print_info "Creating .env file with default credentials..."
    touch .env
    echo "ADMIN_USERNAME=\"admin\"" >> .env
    echo "ADMIN_PASSWORD=\"admin\"" >> .env
    print_warning "A default .env file has been created. Please edit it to set your secure credentials."
fi

# 7. Install project dependencies
print_info "Installing project dependencies..."
npm install || print_error "npm install failed."

# 8. Build the Next.js application
print_info "Building the application for production..."
npm run build || print_error "npm run build failed."

# 9. Create PAC directory and set permissions
print_info "Creating base directory for PAC files at '$PAC_DIR'..."
mkdir -p "$PAC_DIR" || print_error "Failed to create PAC directory. Check permissions."
chown -R www-data:www-data /var/www/html 
chmod -R 775 /var/www/html
print_success "PAC directory is ready."

# 10. Start the application with PM2
print_info "Starting the application with PM2..."
pm2 stop "$PM2_APP_NAME" 2>/dev/null || true
pm2 delete "$PM2_APP_NAME" 2>/dev/null || true
pm2 start npm --name "$PM2_APP_NAME" -- start --user www-data || print_error "Failed to start the application with PM2."

# 11. Configure PM2 to start on system startup
print_info "Configuring PM2 to start on boot..."
env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u www-data --hp /home/www-data
pm2 save || print_warning "Could not save PM2 process list."

# 12. Create the management UI script in the installation directory
UI_SCRIPT_PATH="$INSTALL_DIR/pac-ui.sh"
print_info "Creating management UI script ($UI_SCRIPT_PATH)..."
cat > "$UI_SCRIPT_PATH" << 'EOF'
#!/bin/bash

# PAC-Management UI Script

# --- Colors ---
C_RESET='\033[0m'
C_RED='\033[0;31m'
C_GREEN='\033[0;32m'
C_YELLOW='\033[0;33m'
C_BLUE='\033[0;34m'

# --- App Config ---
PM2_APP_NAME="pac-management"
INSTALL_DIR="/opt/PAC-Management" # Corrected install dir
REPO_URL="https://github.com/dwnilii/PAC-Management.git"

# --- Helper Functions ---
print_info() { echo -e "${C_BLUE}[INFO] $1${C_RESET}"; }
print_success() { echo -e "${C_GREEN}[SUCCESS] $1${C_RESET}"; }
print_warning() { echo -e "${C_YELLOW}[WARNING] $1${C_RESET}"; }
print_error() { echo -e "${C_RED}[ERROR] $1${C_RESET}"; }

# --- Menu Functions ---

reinstall_app() {
    print_warning "This will stop the service, delete project files, and reinstall from GitHub."
    read -p "Are you sure you want to reinstall? [y/N]: " confirm
     if [[ "$confirm" =~ ^[yY](es)?$ ]]; then
        print_info "Stopping service..."
        pm2 stop "$PM2_APP_NAME" &>/dev/null
        print_info "Deleting old directory..."
        rm -rf "$INSTALL_DIR"
        print_info "Re-running installation script from main..."
        curl -sL ${REPO_URL/%.git/}/raw/main/install.sh | sudo bash
        print_success "Reinstallation complete."
    else
        echo "Reinstall cancelled."
    fi
}

uninstall_app() {
    print_warning "This will stop the service, delete all project files, and remove the PM2 process."
    read -p "Are you sure you want to uninstall? [y/N]: " confirm
    if [[ "$confirm" =~ ^[yY](es)?$ ]]; then
        print_info "Stopping and deleting PM2 process..."
        pm2 stop "$PM2_APP_NAME" && pm2 delete "$PM2_APP_NAME"
        pm2 save --force
        print_info "Removing project directory: $INSTALL_DIR"
        rm -rf "$INSTALL_DIR"
        print_info "Removing Nginx config..."
        rm -f /etc/nginx/sites-enabled/pac-management
        rm -f /etc/nginx/sites-available/pac-management
        systemctl reload nginx
        print_success "PAC-Management has been uninstalled."
    else
        echo "Uninstall cancelled."
    fi
}

configure_nginx() {
    print_info "Checking for Nginx..."
    if ! command -v nginx &> /dev/null; then
        print_warning "Nginx is not installed. Installing it now..."
        apt-get update && apt-get install -y nginx || { print_error "Failed to install Nginx."; return; }
    fi
    
    NGINX_CONF_PATH="/etc/nginx/sites-available/pac-management"
    print_info "Configuring Nginx to serve PAC files..."
    
    cat > "$NGINX_CONF_PATH" <<EON
server {
    listen 80 default_server;
    server_name _;

    root /var/www/html;

    location /pac/ {
        autoindex on;
        autoindex_exact_size off;
        autoindex_localtime on;
    }

    location / {
        proxy_pass http://localhost:3000; # Assuming default port
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EON

    # Enable the site and remove default
    ln -sf "$NGINX_CONF_PATH" /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Test and reload Nginx
    if nginx -t; then
        systemctl reload nginx
        print_success "Nginx configured and reloaded successfully."
    else
        print_error "Nginx configuration test failed. Please check the config file."
    fi
}

change_credentials() {
    print_info "Opening .env file for editing. Please change ADMIN_USERNAME and ADMIN_PASSWORD."
    read -p "Press [Enter] to open the file in 'nano' editor..."
    if command -v nano &> /dev/null; then
        nano "$INSTALL_DIR/.env"
    else
        vi "$INSTALL_DIR/.env"
    fi
    print_info "Restarting service to apply changes..."
    pm2 restart "$PM2_APP_NAME"
    print_success "Service restarted. New credentials should be active."
}

show_status() {
    print_info "Displaying status for '$PM2_APP_NAME'..."
    pm2 list
}

show_logs() {
    print_info "Displaying logs for '$PM2_APP_NAME'..."
    pm2 logs "$PM2_APP_NAME"
}

# --- Main Menu Display ---
while true; do
    echo -e "\n${C_BLUE}--- PAC-Management Control Panel ---${C_RESET}"
    echo "1) Install / Re-install"
    echo "2) Uninstall"
    echo "3) Nginx Auto-Config"
    echo "4) Change Admin Password"
    echo "5) Service Status (PM2)"
    echo "6) Service Logs (PM2)"
    echo "0) Exit"
    echo -e "------------------------------------"
    read -p "Please select an option: " choice

    case $choice in
        1) reinstall_app ;;
        2) uninstall_app ;;
        3) configure_nginx ;;
        4) change_credentials ;;
        5) show_status ;;
        6) show_logs ;;
        0) break ;;
        *) echo -e "${C_YELLOW}Invalid option. Please try again.${C_RESET}" ;;
    esac
done

echo -e "${C_GREEN}Exiting control panel.${C_RESET}"
EOF

chmod +x "$UI_SCRIPT_PATH" || print_warning "Could not make $UI_SCRIPT_PATH executable."

# --- Final Instructions ---
print_success "PAC-Management has been successfully installed!"
print_info "The application is running under PM2 with the name '$PM2_APP_NAME'."
print_info "Your panel should be accessible at http://<your_server_ip>"
print_warning "IMPORTANT: Please edit the '.env' file in '$INSTALL_DIR' to set a secure admin username and password."
print_warning "After changing credentials in the .env file, you need to restart the app: pm2 restart $PM2_APP_NAME"
print_info "You can use the management script '$UI_SCRIPT_PATH' for further actions like configuring Nginx."

    