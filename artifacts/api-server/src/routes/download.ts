import { Router, type IRouter } from "express";

const router: IRouter = Router();

const ALLOWED_HOSTS = [
  "server.mp3quran.net",
  "media.mp3quran.net",
  "download.mp3quran.net",
  "cdn.mp3quran.net",
  "mp3quran.net",
  "radio.mp3islam.com",
  "stream.radiojar.com",
  "backup.qurango.net",
];

function isAllowedUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    return ALLOWED_HOSTS.some(
      (h) => u.hostname === h || u.hostname.endsWith(`.${h}`)
    );
  } catch {
    return false;
  }
}

router.get("/download", async (req, res) => {
  const { url, filename } = req.query;

  if (typeof url !== "string" || !url) {
    res.status(400).json({ error: "url parameter is required" });
    return;
  }

  if (!isAllowedUrl(url)) {
    res.status(403).json({ error: "URL host not allowed" });
    return;
  }

  const safeFilename =
    typeof filename === "string" && filename.trim()
      ? filename.trim().replace(/[^\w\u0600-\u06FF\s.\-_()]/g, "_")
      : "surah.mp3";

  const finalName = safeFilename.endsWith(".mp3")
    ? safeFilename
    : `${safeFilename}.mp3`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    let upstream: Response;
    try {
      upstream = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; NoorApp/2.0)",
          Accept: "audio/mpeg, audio/*, */*",
        },
      });
    } finally {
      clearTimeout(timer);
    }

    if (!upstream.ok) {
      /* Upstream unreachable or error – redirect client directly to source */
      res.redirect(302, url);
      return;
    }

    const contentType =
      upstream.headers.get("content-type") || "audio/mpeg";
    const contentLength = upstream.headers.get("content-length");

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(finalName)}"; filename*=UTF-8''${encodeURIComponent(finalName)}`
    );
    res.setHeader("Cache-Control", "no-store");
    if (contentLength) res.setHeader("Content-Length", contentLength);

    if (!upstream.body) {
      res.redirect(302, url);
      return;
    }

    const reader = upstream.body.getReader();
    const pump = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) { res.end(); break; }
        const ok = res.write(Buffer.from(value));
        if (!ok) await new Promise<void>((r) => res.once("drain", r));
      }
    };
    await pump();
  } catch (err: any) {
    /* Network timeout or abort – redirect client directly to source */
    if (!res.headersSent) {
      res.redirect(302, url);
    }
  }
});

export default router;
