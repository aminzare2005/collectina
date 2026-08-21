import PhonecaseGrid from "@/components/phonecase-grid";
import PosterGrid from "@/components/poster-grid";
import HomeCategoryNav from "@/components/home-category-nav";
import HomeSectionHeader from "@/components/home-section-header";
import TopBanner from "@/components/top-banner";
import ShouldIRender from "@/helpers/should-i-render";
import { Store, Send } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const should_i_render = await ShouldIRender();

  const isStoreActive =
    should_i_render.show_poster || should_i_render.show_phonecase;

  if (!isStoreActive) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="p-4 bg-muted rounded-full mb-6">
          <Store className="size-10 text-primary" />
        </div>
        <h2 className="text-2xl font-black mb-3">فروشگاه موقتاً غیرفعاله</h2>
        <p className="text-muted-foreground max-w-sm leading-relaxed mb-8">
          در حال به‌روزرسانی موجودی و آماده‌سازی طرح‌های جدید هستیم. برای اینکه
          اولین نفری باشی که از بازگشایی باخبر میشی، حتماً عضو کانال تلگراممون
          شو.
        </p>
        <Button size="lg" className="h-12 px-8 gap-2" asChild>
          <Link href="https://t.me/CollectinaShop">
            <Send className="size-4" />
            عضویت در کانال تلگرام
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <TopBanner text={should_i_render.top_banner} />

      {should_i_render.show_poster && (
        <section className="flex flex-col gap-4 mt-2">
          <HomeSectionHeader title="پوستر" href="/poster" />
          <PosterGrid pageSize={4} infinite={false} />
        </section>
      )}

      {should_i_render.show_phonecase && (
        <section className="flex flex-col gap-4 mt-2">
          <HomeSectionHeader title="قاب موبایل" href="/phonecase" />
          <PhonecaseGrid pageSize={8} infinite={false} />
        </section>
      )}
    </div>
  );
}
