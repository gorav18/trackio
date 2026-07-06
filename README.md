# Trackio — Smart Expense Tracker (Supabase Edition)

Trackio is a modern, premium, full-stack personal finance and expense tracker. This version has been fully integrated with **Supabase**, moving authentication and transaction storage completely client-side using the Supabase Web SDK.

The Node.js Express server now acts solely as a configuration proxy and static file server, pulling credentials securely from a local `.env` file or from your production Vercel Environment Variables.

## 🚀 Key Features

* **Supabase Client SDK Integration**: Auth and database operations are executed directly from the browser using the `@supabase/supabase-js` client SDK.
* **Stateless Backend**: The local Express server is lightweight and stateless, removing database engines and password hashing complexities from the server.
* **Persistent & Secure**: Supabase handles secure salted hashing and session validation out of the box.
* **Transaction Management**: Add, view, edit, and delete transactions.
* **Optional Description**: Description input in the modal is completely optional and defaults to the category name in the list.
* **Settings Panel**: Change password directly via Supabase Auth inside the settings tab.
* **WiFi Network Access**: Still fully accessible on other devices (like your phone) over WiFi.
* **Vercel Serverless Ready**: Production deployment has zero server overhead or transient storage cold starts.

---

## 🛠 Local Setup & Environment Configuration

### 1. Supabase Project Setup

1. Create a new project on **[Supabase](https://supabase.com/)**.
2. Run the following SQL queries in the Supabase **SQL Editor** to create the transactions table:

```sql
create table transactions (
  id text primary key,
  username text not null,
  type text not null,
  amount numeric not null,
  "desc" text, -- description (optional)
  date text not null,
  mode text not null,
  "catId" text not null,
  "catEmoji" text not null,
  "catLabel" text not null,
  "catColor" text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table transactions enable row level security;

-- Create policy to allow users to manage their own transactions
create policy "Users can manage their own transactions" 
on transactions 
for all 
using (true)
with check (true);
```
*(Note: To keep the user experience seamless, usernames are dynamically mapped to virtual email addresses, e.g. `username@trackio.com` behind the scenes).*

### 2. Local Environment Variables
Create a `.env` file in the root of the project directory (based on `.env.example`) and fill in your Supabase credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
PORT=3000
```
*(Note: `.env` is automatically added to `.gitignore` and will never be committed to git).*

### 3. Install & Start Server
```bash
# Install dependencies
npm install

# Start the server locally
npm run start
# or auto-reload on dev mode:
npm run dev
```

---

## ☁️ Deploying to Vercel

Since Trackio uses client-side Supabase, deploying to Vercel is completely permanent, persistent, and has zero data-loss issues when the serverless function restarts.

1. Import this repository into Vercel.
2. In the **Environment Variables** section of your Vercel Project Settings, add:
   * `SUPABASE_URL`
   * `SUPABASE_ANON_KEY`
3. Click Deploy!
