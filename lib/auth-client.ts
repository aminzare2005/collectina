"use client";

import { createAuthClient } from "better-auth/react";
import { phoneNumberClient } from "better-auth/client/plugins";

/**
 * Better Auth client for browser-side usage.
 *
 * The client communicates with /api/auth/* and manages session cookies.
 * The phoneNumberClient plugin adds signIn.phoneNumber, signUp.phoneNumber,
 * and OTP methods to the client.
 */
export const authClient = createAuthClient({
  plugins: [phoneNumberClient()],
});

// Re-export commonly used methods for convenience
export const { signIn, signUp, useSession, signOut } = authClient;
