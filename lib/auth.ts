import { betterAuth } from "better-auth";
import { phoneNumber } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "pg";

/**
 * Better Auth server configuration.
 *
 * Uses the built-in Kysely adapter for PostgreSQL via a pg.Pool.
 *
 * The phone number plugin enables phone+password sign-in, matching the existing
 * auth flow. The plugin stores the phone on the user record and creates an
 * "account" row with providerId = "credential" for password auth.
 */

const DATABASE_URL = process.env.DATABASE_URL;
const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET;
const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}
if (!BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET is required (min 32 chars, high entropy)");
}

// Better Auth's built-in Kysely adapter needs a pg.Pool, not a URL string.
const pool = new Pool({ connectionString: DATABASE_URL });

export const auth = betterAuth({
  database: pool,
  secret: BETTER_AUTH_SECRET,
  baseURL: BETTER_AUTH_URL,

  // Use emailAndPassword as the base auth method (required by Better Auth even
  // though we use phone — the phoneNumber plugin hooks into the credential flow).
  emailAndPassword: {
    enabled: true,
  },

  // NOTE: The phoneNumber plugin automatically adds "phoneNumber" and
  // "phoneNumberVerified" fields to the user table. Do NOT add a "phone"
  // field here — that would create a separate, unused column.
  user: {}, 

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh every 24h
  },

  advanced: {
    generateId: () => crypto.randomUUID(),
  },

  plugins: [
    phoneNumber(),
    nextCookies(), // must be last — auto-sets cookies in Server Actions
  ],
});

/**
 * Helper: get the current session from request headers.
 * Use in server components, API routes, and server actions.
 *
 * Returns the Better Auth session with user object (including phone field).
 */
export type AuthSession = typeof auth.$Infer.Session;
