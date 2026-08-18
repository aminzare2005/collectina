import { createClient } from "@/lib/supabase/server";

export type ShouldIRenderType = {
  show_poster: boolean;
  show_phonecase: boolean;
  top_banner: string;
};

export default async function ShouldIRender(): Promise<ShouldIRenderType> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("settings")
    .select("show_poster, show_phonecase, top_banner")
    .single();

  if (error) {
    return { show_poster: false, show_phonecase: false, top_banner: "" };
  }

  return {
    show_poster: data?.show_poster ?? false,
    show_phonecase: data?.show_phonecase ?? false,
    top_banner: (data?.top_banner ?? "").trim(),
  };
}
