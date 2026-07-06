const express = require('express');
const { createClient } = require('@libsql/client');
const { Pool } = require('pg');
const crypto = require('node:crypto');
const path = require('path');
const os = require('node:os');

const app = express();
const port = process.env.PORT || 3000;

// Initialize Database Connection
// Trackio automatically supports three databases:
// 1. Vercel Postgres (via process.env.POSTGRES_URL - 1-click persistent storage on Vercel)
// 2. Turso cloud SQLite (via process.env.TURSO_DATABASE_URL & TURSO_AUTH_TOKEN)
// 3. Local SQLite file (fallback to file:database.db or file:/tmp/database.db)
let dbType = 'sqlite'; // 'sqlite' or 'postgres'
let dbClient = null;

if (process.env.POSTGRES_URL) {
  dbType = 'postgres';
  dbClient = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false } // Required for Vercel Postgres serverless connections
  });
  console.log('Database: Using Vercel Postgres (persistent cloud storage)');
} else {
  dbType = 'sqlite';
  const dbUrl = process.env.VERCEL
    ? (process.env.TURSO_DATABASE_URL || 'file:/tmp/database.db')
    : (process.env.TURSO_DATABASE_URL || 'file:database.db');
  const dbAuthToken = process.env.TURSO_AUTH_TOKEN;

  dbClient = createClient({
    url: dbUrl,
    authToken: dbAuthToken
  });
  console.log(`Database: Using SQLite/libSQL at ${dbUrl}`);
}

// Unified Database Execution wrapper
// Automatically translates SQL syntax placeholders from ? (SQLite) to $1, $2... (PostgreSQL)
async function dbExecute(sql, args = []) {
  if (dbType === 'postgres') {
    let count = 0;
    const pgSql = sql.replace(/\?/g, () => {
      count++;
      return `$${count}`;
    });
    const result = await dbClient.query(pgSql, args);
    return {
      rows: result.rows,
      rowsAffected: result.rowCount
    };
  } else {
    const result = await dbClient.execute({ sql, args });
    return result;
  }
}

// Create tables asynchronously
async function initDb() {
  if (dbType === 'postgres') {
    await dbExecute(`
      CREATE TABLE IF NOT EXISTS users (
        username VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL
      )
    `);

    await dbExecute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        amount DOUBLE PRECISION NOT NULL,
        "desc" TEXT NOT NULL,
        date VARCHAR(50) NOT NULL,
        mode VARCHAR(50) NOT NULL,
        catId VARCHAR(100) NOT NULL,
        catEmoji VARCHAR(50) NOT NULL,
        catLabel VARCHAR(100) NOT NULL,
        catColor VARCHAR(50) NOT NULL,
        FOREIGN KEY(username) REFERENCES users(username)
      )
    `);
  } else {
    await dbExecute(`
      CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        password TEXT NOT NULL
      )
    `);

    await dbExecute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        desc TEXT NOT NULL,
        date TEXT NOT NULL,
        mode TEXT NOT NULL,
        catId TEXT NOT NULL,
        catEmoji TEXT NOT NULL,
        catLabel TEXT NOT NULL,
        catColor TEXT NOT NULL,
        FOREIGN KEY(username) REFERENCES users(username)
      )
    `);
  }
}
initDb().catch(err => {
  console.error('Database tables initialization failed:', err);
});

// Simple in-memory session store
const sessions = new Map(); // token -> username

// Helper functions for password hashing
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedValue) {
  const parts = storedValue.split(':');
  if (parts.length !== 2) return false;
  const [salt, originalHash] = parts;
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === originalHash;
}

// Session Parsing Middleware
app.use((req, res, next) => {
  const cookies = req.headers.cookie || '';
  const parsed = {};
  cookies.split(';').forEach(c => {
    const parts = c.split('=');
    if (parts.length === 2) {
      parsed[parts[0].trim()] = parts[1].trim();
    }
  });
  req.sessionToken = parsed['tio_session'];
  req.username = sessions.get(req.sessionToken);
  next();
});

// Middleware to protect routes
function requireAuth(req, res, next) {
  if (!req.username) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }
  next();
}

// API Routes

// Signup
app.post('/api/auth/signup', express.json(), async (req, res) => {
  const { username, password, name } = req.body;
  if (!username || !password || !name) {
    return res.status(400).json({ error: 'Please fill all fields.' });
  }
  const uLower = username.trim().toLowerCase();
  
  if (uLower.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters.' });
  }
  if (!/^[a-z0-9_]+$/.test(uLower)) {
    return res.status(400).json({ error: 'Username can only contain lowercase letters, numbers, underscores.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }
  
  try {
    const existing = await dbExecute('SELECT username FROM users WHERE username = ?', [uLower]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Username already taken. Choose another.' });
    }
    
    const hashedPassword = hashPassword(password);
    await dbExecute('INSERT INTO users (username, name, password) VALUES (?, ?, ?)', [uLower, name.trim(), hashedPassword]);
    
    // Create session
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, uLower);
    
    res.setHeader('Set-Cookie', `tio_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=2592000`);
    res.json({ username: uLower, name: name.trim() });
  } catch (e) {
    console.error('Signup error:', e);
    res.status(500).json({ error: 'Database error' });
  }
});

// Login
app.post('/api/auth/login', express.json(), async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Please fill all fields.' });
  }
  const uLower = username.trim().toLowerCase();
  
  try {
    const userRes = await dbExecute('SELECT * FROM users WHERE username = ?', [uLower]);
    const user = userRes.rows[0];
    if (!user) {
      return res.status(400).json({ error: 'Account not found. Please sign up first.' });
    }
    
    if (!verifyPassword(password, user.password)) {
      return res.status(400).json({ error: 'Incorrect password. Try again.' });
    }
    
    // Create session
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, uLower);
    
    res.setHeader('Set-Cookie', `tio_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=2592000`);
    res.json({ username: uLower, name: user.name });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Database error' });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  if (req.sessionToken) {
    sessions.delete(req.sessionToken);
  }
  res.setHeader('Set-Cookie', 'tio_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
  res.json({ success: true });
});

// Session check
app.get('/api/auth/session', async (req, res) => {
  if (!req.username) {
    return res.status(401).json({ error: 'No active session' });
  }
  try {
    const userRes = await dbExecute('SELECT name FROM users WHERE username = ?', [req.username]);
    const user = userRes.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    res.json({ username: req.username, name: user.name });
  } catch (e) {
    console.error('Session check error:', e);
    res.status(500).json({ error: 'Database error' });
  }
});

// Change password
app.put('/api/auth/change-password', requireAuth, express.json(), async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Please fill all fields.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }
  
  try {
    const userRes = await dbExecute('SELECT password FROM users WHERE username = ?', [req.username]);
    const user = userRes.rows[0];
    if (!user) {
      return res.status(400).json({ error: 'User not found.' });
    }
    
    if (!verifyPassword(currentPassword, user.password)) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }
    
    const hashedNew = hashPassword(newPassword);
    await dbExecute('UPDATE users SET password = ? WHERE username = ?', [hashedNew, req.username]);
    
    res.json({ success: true });
  } catch (e) {
    console.error('Change password error:', e);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get transactions
app.get('/api/transactions', requireAuth, async (req, res) => {
  try {
    const txRes = await dbExecute('SELECT * FROM transactions WHERE username = ? ORDER BY id DESC', [req.username]);
    res.json(txRes.rows);
  } catch (e) {
    console.error('Get transactions error:', e);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get single transaction details
app.get('/api/transactions/:id', requireAuth, async (req, res) => {
  try {
    const txRes = await dbExecute('SELECT * FROM transactions WHERE id = ? AND username = ?', [req.params.id, req.username]);
    const row = txRes.rows[0];
    if (!row) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(row);
  } catch (e) {
    console.error('Get transaction details error:', e);
    res.status(500).json({ error: 'Database error' });
  }
});

// Create transaction
app.post('/api/transactions', requireAuth, express.json(), async (req, res) => {
  const { type, amount, desc, date, mode, catId, catEmoji, catLabel, catColor } = req.body;
  if (!type || amount === undefined || amount <= 0 || desc === undefined || !date || !mode || !catId || !catEmoji || !catLabel || !catColor) {
    return res.status(400).json({ error: 'Please enter valid details.' });
  }
  const id = Date.now().toString();
  
  try {
    await dbExecute(
      `INSERT INTO transactions (id, username, type, amount, "desc", date, mode, catId, catEmoji, catLabel, catColor)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.username, type, amount, desc, date, mode, catId, catEmoji, catLabel, catColor]
    );
    res.json({ success: true, id });
  } catch (e) {
    console.error('Create transaction error:', e);
    res.status(500).json({ error: 'Database error' });
  }
});

// Update transaction
app.put('/api/transactions/:id', requireAuth, express.json(), async (req, res) => {
  const { type, amount, desc, date, mode, catId, catEmoji, catLabel, catColor } = req.body;
  if (!type || amount === undefined || amount <= 0 || desc === undefined || !date || !mode || !catId || !catEmoji || !catLabel || !catColor) {
    return res.status(400).json({ error: 'Please enter valid details.' });
  }
  
  try {
    const info = await dbExecute(
      `UPDATE transactions
       SET type = ?, amount = ?, "desc" = ?, date = ?, mode = ?, catId = ?, catEmoji = ?, catLabel = ?, catColor = ?
       WHERE id = ? AND username = ?`,
      [type, amount, desc, date, mode, catId, catEmoji, catLabel, catColor, req.params.id, req.username]
    );
    
    if (info.rowsAffected === 0) {
      return res.status(404).json({ error: 'Transaction not found or unauthorized.' });
    }
    res.json({ success: true });
  } catch (e) {
    console.error('Update transaction error:', e);
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete transaction
app.delete('/api/transactions/:id', requireAuth, async (req, res) => {
  try {
    const info = await dbExecute('DELETE FROM transactions WHERE id = ? AND username = ?', [req.params.id, req.username]);
    if (info.rowsAffected === 0) {
      return res.status(404).json({ error: 'Transaction not found or unauthorized.' });
    }
    res.json({ success: true });
  } catch (e) {
    console.error('Delete transaction error:', e);
    res.status(500).json({ error: 'Database error' });
  }
});

// Serve frontend files
app.use(express.static(path.join(__dirname)));

// Fallback to index.html for UI SPA routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

function getLocalIpAddresses() {
  const ips = [];
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips;
}

if (require.main === module) {
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running locally at http://localhost:${port}`);
    const localIps = getLocalIpAddresses();
    if (localIps.length > 0) {
      console.log('Or access it over WiFi / local network:');
      localIps.forEach(ip => {
        console.log(`  http://${ip}:${port}`);
      });
    }
  });
}

module.exports = app;
