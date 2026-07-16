import { Router } from "express";

const router = Router();

const ALLOWED_HOSTS = [
  "everyayah.com",
  "cdn.islamic.network",
  "mp3quran.net",
  "verses.quran.com",
  "qurancdn.com",
  "quranicaudio.com",
  "download.quranicaudio.com",
  "podcasts.qurancentral.com",
  "qurancentral.com",
  "archive.org",
  "quran.ksu.edu.sa",
  "ksu.edu.sa",
  "islamic.network",
];

const FETCH_TIMEOUT_MS = 8000;

router.get("/audio-proxy", async (req, res) => {
  const rawUrl = req.query.url as string | undefined;
  if (!rawUrl) {
    res.status(400).json({ error: "Missing url parameter" });
    return;
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    res.status(400).json({ error: "Invalid URL" });
    return;
  }

  if (!ALLOWED_HOSTS.some(h => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`))) {
    res.status(403).json({ error: "Host not allowed" });
    return;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    let upstream: Response;
    try {
      upstream = await fetch(rawUrl, {
        signal: controller.signal,
        headers: { "User-Agent": "NoorApp/2.0" },
      });
    } finally {
      clearTimeout(timer);
    }

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: "Upstream error" });
      return;
    }

    const contentType = upstream.headers.get("content-type") ?? "audio/mpeg";
    const contentLength = upstream.headers.get("content-length");

    res.set("Content-Type", contentType);
    res.set("Cache-Control", "public, max-age=86400");
    res.set("Access-Control-Allow-Origin", "*");
    if (contentLength) res.set("Content-Length", contentLength);

    if (!upstream.body) {
      res.status(502).json({ error: "No response body" });
      return;
    }

    const reader = upstream.body.getReader();
    req.on("close", () => { reader.cancel().catch(() => {}); });

    while (true) {
      const { done, value } = await reader.read();
      if (done) { res.end(); break; }
      const ok = res.write(Buffer.from(value));
      if (!ok) await new Promise<void>(r => res.once("drain", r));
    }
  } catch (err: any) {
    clearTimeout(timer);
    if (!res.headersSent) {
      const isTimeout = err?.name === "AbortError";
      res.status(isTimeout ? 504 : 502).json({
        error: isTimeout ? "Upstream timeout" : "Proxy fetch failed",
      });
    }
  }
});

export default router;
