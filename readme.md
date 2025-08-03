# SKYDASHNET MONITORING TOOLS
<h3 align="center">A modern, web-based dashboard for monitoring and managing MikroTik routers.</h3>

<p align="center">
    <a href="https://github.com/skydashnet/skydash-next-monitoring/blob/main/LICENSE">
        <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
    </a>
    <a href="#">
        <img src="https://img.shields.io/badge/version-1.5.8-green.svg" alt="Version">
    </a>
</p>

<p align="center">
<em>Last checked for updates on: N/A</em>
</p>

Skydash.NET is a full-stack application designed to provide an intuitive and powerful interface for managing MikroTik devices. It combines a real-time monitoring dashboard with comprehensive management tools for PPPoE, Hotspot, and network assets, enhanced with an interactive WhatsApp bot for on-the-go management.

---

### ✨ Key Features
* **Real-time Dashboard**: Monitor CPU, RAM, disk usage, and interface traffic in real-time.
* **PPPoE & Hotspot Management**: View, add, edit, delete, disable, and kick active users with ease.
* **IP Pool Management**: Automatically assign IP addresses to new PPPoE users based on profiles.
* **Network Asset Mapping**: Visualize your network infrastructure (ODP, ODC, etc.) on an interactive map with KML import functionality.
* **SLA Reporting**: Track user uptime and generate Service Level Agreement reports.
* **Interactive WhatsApp Bot**:
    * Receive critical alerts (high CPU, device offline).
    * Get automated daily performance reports.
    * Execute commands directly from WhatsApp (e.g., check user status, kick users).
* **Secure Authentication**: Two-factor authentication using OTP sent via WhatsApp.
* **Multi-Device & Multi-User Ready**: Built with a workspace concept to support multiple users and devices.

---

### 🛠️ Tech Stack

| Frontend                               | Backend                                     |
| -------------------------------------- | ------------------------------------------- |
| **Next.js 15** (with App Router)       | **Node.js** |
| **React 19** & **TypeScript** | **Express.js** |
| **Tailwind CSS** | **MySQL 8** |
| **Chart.js** for data visualization    | **node-routeros** for MikroTik API          |
| **Leaflet** for interactive maps       | **@whiskeysockets/baileys** for WhatsApp Bot |
| **Framer Motion** for animations       | **JWT** for Authentication                  |
| **shadcn/ui** (components)             | **node-cron** for Scheduled Tasks           |

---

### 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

#### Prerequisites

* [Node.js](https://nodejs.org/) (v18 or later)
* [MySQL](https://www.mysql.com/) or MariaDB
* A RouterOS 7.xx version
* A dedicated WhatsApp number for the bot.

#### Backend Setup
1.  **Navigate to the backend directory:**
```bash
cd Skydash.NET Apps/backend
 ```

2.  **Install dependencies:**
```bash
npm install
```

3.  **Setup the database:**
* Create a new MySQL database (e.g., `skydash_net`).
* Execute the SQL statements from the [Database Schema](#-database-schema) section below to create all the necessary tables.

4.  **Configure environment variables:**
* Create a `.env` file in the `backend` directory by copying `.env.example` (if available) or creating a new one.
* Fill in the required variables:
```env
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=skydash_net
JWT_SECRET=your_super_secret_jwt_key
 PORT=9494
```
        
5.  **Run the backend server:**
```bash
npm run dev
```
The backend API will be running on `http://localhost:9494`.

#### Frontend Setup

1.  **Navigate to the frontend directory:**
```bash
cd "Skydash.NET Apps/next"
```

2.  **Install dependencies:**
```bash
npm install
```

3.  **Run the frontend development server:**
```bash
npm run dev
```
The application will be accessible at `http://localhost:3000`.

---

### 📚 Documentation
For a more in-depth guide on configuration, architecture, and feature usage, please visit the **[Skydash.NET Project Wiki](https://github.com/skydashnet/skydash-next-monitoring/wiki)**.

The wiki contains detailed information on:
* Database Schema
* MikroTik Script Configuration
* Feature Workflows
* And much more.

### 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/skydashnet/skydash-next-monitoring/issues).

1. **Fork** the Project
2. Create your Feature Branch (`git checkout -b feature/NewFeature`)
3. Commit your Changes (`git commit -m 'Add some New Feature'`)
4. Push to the Branch (`git push origin feature/NewFeature`)
5. Open a **Pull Request**
---

### 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
