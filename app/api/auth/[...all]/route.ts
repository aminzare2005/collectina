import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

/**
 * Better Auth catch-all route handler.
 * Handles all /api/auth/* requests (sign-in, sign-up, sign-out, session, etc.)
 */
export const { GET, POST } = toNextJsHandler(auth);
