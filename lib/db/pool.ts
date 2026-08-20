import postgres from "postgres";

/**
 * postgres.js connection pool.
 *
 * Usage:
 *   import { sql } from "@/lib/db/pool";
 *   const rows = await sql<Row[]>`SELECT * FROM products WHERE id = ${id}`;
 *
 * The pool is created lazily on first import and shared across the process.
 * For server components / API routes (Node.js runtime) this is ideal.
 * For Edge runtime, switch to a Neon/serverless driver later.
 */

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL environment variable is not set. " +
      "Set it to your PostgreSQL connection string (e.g. postgres://user:pass@host:5432/collectina)."
  );
}

export const sql = postgres(databaseUrl, {
  max: 10, // connection pool size
  idle_timeout: 20,
  connect_timeout: 10,
  // On production, you may want:
  // ssl: { rejectUnauthorized: false },
});
