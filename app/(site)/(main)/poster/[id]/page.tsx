import { ProductRepository } from "@/lib/repositories";
import { getCachedPosterCatalog } from "@/lib/cache";
import { notFound } from "next/navigation";
import AdminBar from "@/components/admin-bar";
import PosterCard from "@/components/poster-card";
import { PosterSelector } from "@/components/poster-selector";
import ShouldIRender from "@/helpers/should-i-render";
import { ProductDetailShell } from "@/components/product/product-detail-shell";
import { Ruler, Sparkles } from "lucide-react";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const should_i_render = await ShouldIRender();

  const product = await ProductRepository.getById(id, "poster");

  if (!product) {
    notFound();
  }

  const posters = await getCachedPosterCatalog();

  return (
    <>
      <AdminBar
        id={product.id}
        image_url={product.image_url}
        product_type="poster"
      />

      <ProductDetailShell
        categoryHref="/poster"
        categoryLabel="پوستر"
        categoryBadge="پوستر دیواری"
        productName={product.name}
        description={product.description}
        visualVariant="poster"
        visual={
          <PosterCard quality="high" image_url={product.image_url} size="big" />
        }
        highlights={[
          {
            icon: Sparkles,
            title: "کیفیت بالا",
            description: "چاپ با بهترین پرینتر و متریال موجود توی ایران",
          },
          {
            icon: Ruler,
            title: "سایز استاندارد",
            description: "پرینت‌ها در ابعاد استاندارد جهانی پوستر انجام میشن",
          },
        ]}
        faqItems={[
          {
            id: "material",
            question: "کدوم کاغذ بهتره؟",
            answer: (
              <>
                کاغذ ساده بیشتر برای ژورنال یا ابعاد
                بزرگ‌تره و گلاسه که دوام بیشتری داره برای دیوار یا قاب کردن استفاده میشه.
              </>
            ),
          },
          {
            id: "shipping",
            question: "چقدر طول میکشه به دستم برسه؟",
            answer: (
              <>
                نهایتا یک روز کاری بعد از ثبت، بسته ارسال میشه.
                <br />
                ارسال پست معمولا بین ۳ تا ۷ روز طول می‌کشه و بعد از ثبت سفارش
                وضعیتش رو از سایت می‌بینی.
              </>
            ),
          },
        ]}
        purchase={
          <PosterSelector
            productId={product.id}
            posters={posters || []}
            shouldIRender={should_i_render}
          />
        }
      />
    </>
  );
}
