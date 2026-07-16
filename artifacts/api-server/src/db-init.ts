import { pool } from "@workspace/db";

export async function initDatabase(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
    console.log("[DB] Database connection verified ✓");
  } catch (err) {
    console.error("[DB] Database connection failed:", err);
  } finally {
    client.release();
  }
}
