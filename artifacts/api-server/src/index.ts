import app from "./app";
import { initDatabase } from "./db-init";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

initDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}).catch((err) => {
  console.error("[Startup] DB init error:", err);
  app.listen(port, () => {
    console.log(`Server listening on port ${port} (DB may not be fully initialized)`);
  });
});
