require('dotenv').config();
const express = require('express');
const path = require('path');
const os = require('node:os');

const app = express();
const port = process.env.PORT || 3000;

// API Route to serve Supabase configuration keys to the client
// This allows the client-side SPA to connect to Supabase dynamically
// using keys configured in the server's environment (.env file or Vercel Settings)
app.get('/api/config', (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || ''
  });
});

// Serve frontend static files
app.use(express.static(path.join(__dirname)));

// Fallback to index.html for client-side routing (SPA fallback)
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
