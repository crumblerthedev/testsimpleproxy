const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Track active users
let activeUsers = 0;
const MAX_USERS = 20; // max concurrent users

// Simple URL validation
function isValidUrl(url) {
  return url.startsWith('http://') || url.startsWith('https://');
}

// Proxy middleware
const proxy = createProxyMiddleware({
  target: 'https://example.com', // default target
  changeOrigin: true,
  ws: true,
  router: (req) => {
    const url = req.query.url;
    if (url && isValidUrl(decodeURIComponent(url))) {
      return decodeURIComponent(url);
    }
    return 'https://example.com';
  },
  onProxyReq: (proxyReq) => {
    proxyReq.removeHeader('cookie'); // optional
  }
});

// Limit concurrent users
app.use('/proxy', (req, res, next) => {
  if (activeUsers >= MAX_USERS) {
    return res.send("Server busy, please try again later.");
  }
  activeUsers++;
  res.on('finish', () => activeUsers--);
  next();
}, proxy);

// Serve the frontend “proxy browser”
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Proxy Browser</title>
        <style>
          body { font-family: sans-serif; text-align: center; margin-top: 50px; }
          input { width: 400px; padding: 8px; }
          button { padding: 8px 16px; }
          iframe { width: 90%; height: 80vh; margin-top: 20px; border: 1px solid #ccc; }
        </style>
      </head>
      <body>
        <h2>Proxy Browser</h2>
        <form id="proxyForm">
          <input id="urlInput" placeholder="Enter website URL (e.g., https://poki.com)" />
          <button>Go</button>
        </form>
        <iframe id="proxyFrame" src=""></iframe>

        <script>
          const form = document.getElementById('proxyForm');
          const input = document.getElementById('urlInput');
          const iframe = document.getElementById('proxyFrame');

          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const target = encodeURIComponent(input.value);
            iframe.src = '/proxy?url=' + target;
          });
        </script>
      </body>
    </html>
  `);
});

// Start server
const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Proxy browser running on port ${port}`));
