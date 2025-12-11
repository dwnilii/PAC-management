# PAC-Management Panel

[برای مشاهده نسخه فارسی اینجا کلیک کنید (Click here for Persian version)](./README-fa.md)

This project is a powerful and comprehensive web-based management panel built with Next.js, TypeScript, and TailwindCSS. The primary goal of this panel is to provide a central solution for creating, managing, and serving Proxy Auto-Config (PAC) files for different organizational units (OUs).

### ✨ Key Features

-   **Organizational Unit (OU) Management:** Organize your network into different groups (OUs) and define specific proxy rules for each.
-   **Proxy Management:** Easily define and manage various proxy servers (HTTP, HTTPS, SOCKS4, SOCKS5) that will be used in your PAC files.
-   **Advanced PAC Rule Generation:** Define complex rules to direct user traffic. For each OU, you can either:
    -   **Proxy all traffic** and define a list of domains to **bypass** (connect directly).
    -   **Connect directly** for all traffic and define a list of domains to be routed through the **proxy**.
-   **Automatic PAC File Creation:** When an OU is created or updated, the system automatically generates or modifies the corresponding `.pac` file on the server.
-   **Centralized Deployment:** PAC files are stored in a structured way on the server (e.g., `/var/www/html/pac/OU_NAME/OU_NAME.pac`), allowing you to easily point your users' browsers to the correct configuration URL.
-   **Modern and Responsive UI:** Designed with ShadCN UI and TailwindCSS for the best user experience.


### 🛠️ Manual Installation

If you prefer to install the application step-by-step, follow these instructions.

**Prerequisites:**
-   Node.js (version 18 or higher)
-   npm
-   git
-   PM2 (`npm install pm2 -g`)

**1. Clone the Repository**
```bash
git clone https://github.com/dwnilii/PAC-Management.git
cd PAC-Management
```

**2. Install Dependencies**
```bash
npm install
```


**3. Build the Application**
Compile the Next.js application for production.
```bash
npm run build
```

**4. Run with PM2**
We recommend using PM2 to keep the application running continuously.

Start the application
```
pm2 start npm --name "pac-management" -- start
```
Save the process list to have it restart on server reboot
```
pm2 save
```
Optional: Configure PM2 to start on boot
```
pm2 startup
```

Your panel should now be running on `http://<your_server_ip>:3000`.



<img width="1513" height="861" alt="Screenshot 2025-09-19 132047" src="https://github.com/user-attachments/assets/2e67d4bc-6c67-4577-a916-0743ce60fcc2" />
<img width="1511" height="868" alt="Screenshot 2025-09-19 132351" src="https://github.com/user-attachments/assets/c0f187a7-2c35-49cd-9280-271928a073d3" />
<img width="1324" height="836" alt="Screenshot 2025-09-19 180204" src="https://github.com/user-attachments/assets/f3379a6f-e5fa-428b-9548-73a86ac78cde" />
<img width="1499" height="837" alt="Screenshot 2025-09-19 180939" src="https://github.com/user-attachments/assets/3d68a3f1-8f3f-4ed9-b92e-6443d6e065ea" />
<img width="563" height="794" alt="Screenshot 2025-09-19 180228" src="https://github.com/user-attachments/assets/c141d925-2204-4191-9f88-fa2bd8ef0960" />

