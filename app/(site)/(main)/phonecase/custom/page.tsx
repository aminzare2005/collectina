import CustomPhoneCasePageClient from "@/features/custom/custom-phonecase-page-client";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

export default async function ProductPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  if (user.phone !== process.env.NEXT_PUBLIC_ADMIN_PHONE_NUMBER) {
    redirect(notFound());
  }

  const { data: phoneCases } = await supabase
    .from("phone_cases")
    .select("*")
    .order("available", { ascending: false })
    .order("brand")
    .order("model");

  return <CustomPhoneCasePageClient phoneCases={phoneCases || []} />;
}
