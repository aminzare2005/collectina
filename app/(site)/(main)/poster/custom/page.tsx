import CustomPosterPageClient from "@/features/custom/custom-poster-page-client";
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

  const { data: poster } = await supabase
    .from("posters")
    .select("*")
    .order("attribute");

  return <CustomPosterPageClient poster={poster || []} />;
}
