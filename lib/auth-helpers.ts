import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Get the current authenticated user from the request session.
 *
 * Use this in:
 * - Server components
 * - Server actions
 * - API routes
 * - Route handlers
 *
 * Returns null if not authenticated.
 *
 * The returned user includes the `phoneNumber` field from Better Auth's
 * phone-number plugin.
 */
export async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) return null;

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
    phoneNumber: (session.user as Record<string, unknown>).phoneNumber as
      | string
      | undefined,
    createdAt: session.user.createdAt,
  };
}

/**
 * Check if the current user is the admin.
 * Admin is identified by phone number matching the env var.
 *
 * Pass an already-fetched user to avoid a second session lookup
 * (getCurrentUser() hits the DB every time).
 */
export async function isAdmin(
  user?: Awaited<ReturnType<typeof getCurrentUser>>,
): Promise<boolean> {
  const currentUser = user ?? (await getCurrentUser());
  if (!currentUser?.phoneNumber) return false;
  return currentUser.phoneNumber === process.env.NEXT_PUBLIC_ADMIN_PHONE_NUMBER;
}

/**
 * Require authentication — throws/redirects if not logged in.
 * Use in server actions and API routes that require auth.
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}
