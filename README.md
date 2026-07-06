# Trackio — Smart Expense Tracker

Trackio is a modern, premium, full-stack personal finance and expense tracker built with Node.js, Express, and SQL (SQLite/libSQL/PostgreSQL). It helps users manage their income and expenses, visualize their spending splits with dynamic canvas-based charts, and keep track of daily averages.

## 🚀 Key Features

* **Full-Stack Architecture**: Dynamic server-side API endpoints replace client-side localStorage.
* **Dual-Database Adapter Engine**: Automatically supports local file-based SQLite database for development, and cloud-persisted Vercel Postgres or Turso for production/Vercel.
* **Secure Authentication**: User signup, login, and sessions using HttpOnly cookies. Passwords are encrypted using salted PBKDF2 hashing.
* **Transaction Management**: Add, view, edit, and delete transactions.
* **Smart UI Handlers**: 
  * Displays the expense emoji (`💸`) for all income entries in the list.
  * Description is completely optional; falls back to showing the Category Label (e.g. `Food`, `Study`) if omitted.
* **Account Settings**: A settings panel to securely change passwords and manage sessions.
* **WiFi Network Access**: Binds to all network interfaces (`0.0.0.0`) so you can access it on other devices (like your phone) over WiFi.
* **Vercel Serverless Ready**: Configured for seamless deployment to Vercel with path rewrites and read-only filesystem fallbacks.

## 🛠 Tech Stack

* **Frontend**: HTML5, Vanilla CSS3 (custom CSS design system with micro-animations), and Vanilla JavaScript.
* **Backend**: Node.js, Express.
* **Database**: SQLite/libSQL (`@libsql/client`) or PostgreSQL (`pg`).
* **Session & Security**: Native `node:crypto` hashing (PBKDF2) and HttpOnly session cookies.

---

## 💻 Local Development Setup

### Prerequisites

* [Node.js](https://nodejs.org/) (v22.5.0+ recommended)
* [npm](https://www.npmjs.com/)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <your-repository-url>
   cd trackio
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local server**:
   ```bash
   npm run start
   # Or for auto-reload on file edits:
   npm run dev
   ```

4. **Access the application**:
   * Local: [http://localhost:3000](http://localhost:3000)
   * Local Network / WiFi: The server logs will print the exact local IPv4 address (e.g., `http://192.168.x.x:3000`) for network access.

---

## ☁️ Production Deployment (Vercel)

Vercel functions are stateless and ephemeral. To prevent your data from vanishing when Vercel restarts or builds a new deployment, you **must use a persistent cloud database** (Option A or Option B).

### Option A: Vercel Postgres (Recommended - 1-Click Setup)

1. Open your Vercel Project Dashboard.
2. Go to the **Storage** tab.
3. Click **Connect Database** and choose **Postgres**.
4. Vercel will automatically provision the database and inject the `POSTGRES_URL` environment variable.
5. Deploy/re-deploy your project. Trackio will automatically detect Vercel Postgres, initialize the tables, and save all data securely in the cloud with zero data loss on updates.

### Option B: Turso (libSQL/SQLite Cloud)

1. Create a database on **[Turso](https://turso.tech/)**.
2. Add the following **Environment Variables** in your Vercel Project Settings:
   * `TURSO_DATABASE_URL` (e.g., `libsql://your-db-org.turso.io`)
   * `TURSO_AUTH_TOKEN` (your Turso database authorization token)
3. Redeploy your project.

---

## 📂 Project Structure

```text
├── api/
│   └── index.js          # Vercel serverless function entrypoint
├── database.db           # Local SQLite file database (git-ignored)
├── index.html            # Main frontend page
├── package.json          # Node project scripts & dependencies
├── problems.md           # Tracked issues & resolutions
├── server.js             # Express application & API router
└── vercel.json           # Vercel deployment & rewrite configuration
```
