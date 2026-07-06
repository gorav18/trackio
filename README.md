# Trackio — Smart Expense Tracker (FastAPI & Supabase Edition)

Trackio is a modern, premium, full-stack personal finance and expense tracker. This version uses a **Python FastAPI** backend to act as a configuration proxy and serve static files, while authentication and transaction storage are managed client-side via the Supabase Web SDK.

## 🚀 Key Features

* **Python FastAPI Backend**: Lightweight, high-performance Python ASGI backend serves the static single-page application (SPA) and config API.
* **Supabase Client SDK Integration**: Auth and database operations are executed directly from the browser using the `@supabase/supabase-js` client SDK.
* **Stateless Architecture**: No server-side SQL drivers or session stores needed; fully compatible with serverless environments.
* **Optional Description**: Description input in the modal is completely optional and defaults to the category name in the list.
* **Account Settings**: Users can change passwords securely using Supabase Auth.
* **WiFi Network Access**: Binds to all network interfaces (`0.0.0.0`) so you can access it on other devices (like your phone) over WiFi.
* **Vercel Serverless Ready**: Natively configured for seamless Python deployments on Vercel.

## 🛠 Tech Stack

* **Frontend**: HTML5, Vanilla CSS3, and Vanilla JavaScript.
* **Backend**: Python 3, FastAPI, Uvicorn.
* **Database & Auth**: Supabase Web SDK.

---

## 💻 Local Development Setup

### Prerequisites

* Python 3.9+
* pip

### Installation

1. **Clone the repository**:
   ```bash
   git clone <your-repository-url>
   cd trackio
   ```

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory (copy from `.env.example`) and fill in your Supabase credentials:
   ```env
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Start the local development server**:
   ```bash
   python main.py
   ```

5. **Access the application**:
   * Localhost: [http://localhost:3000](http://localhost:3000)
   * Local Network / WiFi: The terminal will print your exact local IPv4 addresses (e.g. `http://192.168.x.x:3000`) for network access.

---

## ☁️ Deploying to Vercel

Trackio runs out of the box on Vercel's native Python serverless runtime.

1. Import this repository into Vercel.
2. In the **Environment Variables** section of your Vercel Project Settings, add:
   * `SUPABASE_URL`
   * `SUPABASE_ANON_KEY`
3. Click **Deploy**!

---

## 📂 Project Structure

```text
├── api/
│   └── index.py          # FastAPI serverless function entrypoint
├── .env                  # Local environment configurations (git-ignored)
├── .env.example          # Environment variables template
├── index.html            # Main frontend page
├── main.py               # Local startup entry point for python
├── problems.md           # Tracked issues & resolutions
├── requirements.txt      # Python dependencies list
└── vercel.json           # Vercel deployment & rewrite configuration
```
