// Simple local server for testing (alternative to vercel dev)
// Run with: node server.js

require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Handle API routes
  if (pathname.startsWith('/api/')) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      res.end();
      return;
    }

    if (pathname === '/api/create-checkout-session') {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', async () => {
        try {
          const checkoutHandler = require('./api/create-checkout-session.js');
          
          // Mock Vercel request/response
          const mockReq = {
            method: req.method,
            body: JSON.parse(body),
            headers: req.headers,
          };
          
          const mockRes = {
            statusCode: 200,
            headers: {},
            body: null,
            status: function(code) {
              this.statusCode = code;
              return this;
            },
            json: function(data) {
              this.body = JSON.stringify(data);
              return this;
            },
            setHeader: function(key, value) {
              this.headers[key] = value;
            },
            end: function() {
              res.writeHead(this.statusCode, {
                'Content-Type': 'application/json',
                ...this.headers
              });
              res.end(this.body || '{}');
            }
          };
          
          await checkoutHandler(mockReq, mockRes);
          
          // Send response
          if (!res.headersSent) {
            res.writeHead(mockRes.statusCode, {
              'Content-Type': 'application/json',
              ...mockRes.headers
            });
            res.end(mockRes.body || '{}');
          }
        } catch (error) {
          console.error('API Error:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      });
      return;
    }
  }

  // Serve static files - try root directory first, then public directory
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  
  // Check if file exists in root
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // Try public directory
      filePath = path.join(__dirname, 'public', pathname === '/' ? 'index.html' : pathname);
    }
    
    // Check if file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        // File not found
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>');
        return;
      }

      // Read and serve file
      fs.readFile(filePath, (err, content) => {
        if (err) {
          res.writeHead(500);
          res.end('Server Error');
          return;
        }

        const ext = path.extname(filePath);
        const contentType = mimeTypes[ext] || 'text/plain';

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      });
    });
  });
});

server.listen(PORT, () => {
  console.log('\n🚀 JARVIS Omega Local Server');
  console.log('='.repeat(50));
  console.log(`\n✅ Server running at: http://localhost:${PORT}`);
  console.log(`\n📄 Pages:`);
  console.log(`   • Home:     http://localhost:${PORT}/`);
  console.log(`   • Pricing:  http://localhost:${PORT}/pricing.html`);
  console.log(`   • Download: http://localhost:${PORT}/download.html`);
  console.log(`   • Success:  http://localhost:${PORT}/success.html`);
  console.log(`\n💳 API:`);
  console.log(`   • Checkout: http://localhost:${PORT}/api/create-checkout-session`);
  console.log('\n⏹️  Press Ctrl+C to stop\n');
});
