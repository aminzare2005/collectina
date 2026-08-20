import CustomPhoneCasePageClient from "@/features/custom/custom-phonecase-page-client";
import { getCurrentUser, isAdmin } from "@/lib/auth-helpers";
import { VariantRepository } from "@/lib/repositories";
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

  const phoneCases = await VariantRepository.getAllPhoneCases();

  return <CustomPhoneCasePageClient phoneCases={phoneCases} />;
}
