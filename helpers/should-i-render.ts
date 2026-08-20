import { getCachedSettings } from "@/lib/cache";

export type ShouldIRenderType = {
  show_poster: boolean;
  show_phonecase: boolean;
  top_banner: string;
};

export default async function ShouldIRender(): Promise<ShouldIRenderType> {
  const settings = await getCachedSettings();

  if (!settings) {
    return { show_poster: false, show_phonecase: false, top_banner: "" };
  }

  return {
    show_poster: settings.show_poster,
    show_phonecase: settings.show_phonecase,
    top_banner: (settings.top_banner ?? "").trim(),
  };
}
