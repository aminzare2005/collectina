import CustomPosterPageClient from "@/features/custom/custom-poster-page-client";
import { getCurrentUser, isAdmin } from "@/lib/auth-helpers";
import { getCachedPosters } from "@/lib/cache";
import { notFound, redirect } from "next/navigation";

export default async function ProductPage() {
  const user = await getCurrentUser();
  const admin = await isAdmin();

  if (!user) {
    redirect("/auth/login");
  }

  if (!admin) {
    redirect(notFound());
  }

  const poster = await getCachedPosters();

  return <CustomPosterPageClient poster={poster} />;
}
