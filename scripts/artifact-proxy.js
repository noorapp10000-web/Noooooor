#!/usr/bin/env node
/**
 * Lightweight HTTP reverse-proxy used by dev-artifact.sh.
 * Forwards all traffic from PROXY_PORT to TARGET_PORT (main Vite dev server).
 * Uses only Node.js built-ins — no file watchers, no Vite overhead.
 */

const http = require('http');
const net  = require('net');

const PROXY_PORT  = Number(process.argv[2] || process.env.PORT || 19382);
const TARGET_PORT = Number(process.argv[3] || 5000);
const TARGET_HOST = 'localhost';

function waitForTarget(cb) {
  const attempt = () => {
    const sock = new net.Socket();
    sock.setTimeout(500);
    sock.connect(TARGET_PORT, TARGET_HOST, () => {
      sock.destroy();
      cb();
    });
    sock.on('error', () => { sock.destroy(); setTimeout(attempt, 600); });
    sock.on('timeout', () => { sock.destroy(); setTimeout(attempt, 600); });
  };
  attempt();
}

console.log(`[artifact-proxy] Waiting for Vite on port ${TARGET_PORT}…`);

waitForTarget(() => {
  console.log(`[artifact-proxy] Vite ready. Proxying :${PROXY_PORT} → :${TARGET_PORT}`);

  const server = http.createServer((req, res) => {
    const options = {
      hostname: TARGET_HOST,
      port:     TARGET_PORT,
      path:     req.url,
      method:   req.method,
      headers:  { ...req.headers, host: `localhost:${TARGET_PORT}` },
    };

    const proxy = http.request(options, (pr) => {
      res.writeHead(pr.statusCode ?? 200, pr.headers);
      pr.pipe(res, { end: true });
    });

    proxy.on('error', (err) => {
      if (!res.headersSent) res.writeHead(502);
      res.end(`Proxy error: ${err.message}`);
    });

    req.pipe(proxy, { end: true });
  });

  /* WebSocket upgrade passthrough */
  server.on('upgrade', (req, socket, head) => {
    const conn = net.connect(TARGET_PORT, TARGET_HOST, () => {
      conn.write(
        `${req.method} ${req.url} HTTP/1.1\r\n` +
        Object.entries(req.headers).map(([k, v]) => `${k}: ${v}`).join('\r\n') +
        '\r\n\r\n',
      );
      conn.write(head);
      socket.pipe(conn);
      conn.pipe(socket);
    });
    conn.on('error', () => socket.destroy());
    socket.on('error', () => conn.destroy());
  });

  server.listen(PROXY_PORT, () => {
    console.log(`[artifact-proxy] Ready on port ${PROXY_PORT}`);
  });
});
