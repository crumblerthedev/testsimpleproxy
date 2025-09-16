const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

let activeUsers = 0;
const MAX_USERS = 20;

// Helper to validate URLs
function isValidUrl(str) {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

// Proxy middleware
const proxy = createProxyMiddleware({
  target: 'http://example.com', // dummy, overridden by router
  changeOrigin: true,
  ws: true,
  router: (req) => {
    const rawUrl = req.query.url;
    if (rawUrl && isValidUrl(decodeURIComponent(rawUrl))) {
      return decodeURIComponent(rawUrl);
    }
    return 'https://example.com';
  },
  onProxyReq: (proxyReq) => {
    proxyReq.removeHeader('cookie'); // strip cookies for privacy
  }
});

// Limit concurrent users + apply proxy
app.use('/proxy', (req, res, next) => {
  if (activeUsers >= MAX_USERS) {
    return res.send("Server busy, please try again later.");
  }
  activeUsers++;
  res.on('finish', () => activeUsers--);
  next();
}, proxy);

// Frontend
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Proxy Browser</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; margin: 20px; }
          input { width: 400px; padding: 8px; }
          button { padding: 8px; }
          iframe { width: 95%; height: 80vh; border: 1px solid #ccc; margin-top: 20px; }
        </style>
      </head>
      <body>
        <h2>Proxy Browser</h2>
        <form id="proxyForm">
          <input id="urlInput" placeholder="Enter website URL (e.g., https://poki.com)" />
          <button>Go</button>
        </form>
        <iframe id="proxyFrame"></iframe>

        <script>
          const form = document.getElementById('proxyForm');
          const input = document.getElementById('urlInput');
          const iframe = document.getElementById('proxyFrame');

          form.addEventListener('submit', (e) => {
            e.preventDefault();
            let url = input.value.trim();
            if (!url.startsWith("http://") && !url.startsWith("https://")) {
              url = "https://" + url;
            }
            iframe.src = "/proxy?url=" + encodeURIComponent(url);
          });
        </script>
      </body>
    </html>
  `);
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log("Proxy running on port " + port));
