import { ProductRepository, VariantRepository } from "@/lib/repositories";
import { PhoneCaseSelector } from "@/components/phone-case-selector";
import { notFound } from "next/navigation";
import PhonecaseCard from "@/components/phonecaseCard";
import AdminBar from "@/components/admin-bar";
import ShouldIRender from "@/helpers/should-i-render";
import { ProductDetailShell } from "@/components/product/product-detail-shell";
import { Shield, Smartphone } from "lucide-react";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const should_i_render = await ShouldIRender();

  const product = await ProductRepository.getById(id, "phonecase");

  if (!product) {
    notFound();
  }

  const phoneCases = await VariantRepository.getAllPhoneCases();

  return (
    <>
      <AdminBar
        id={product.id}
        image_url={product.image_url}
        product_type="phonecase"
      />

      <ProductDetailShell
        categoryHref="/phonecase"
        categoryLabel="قاب موبایل"
        categoryBadge="قاب موبایل"
        productName={product.name}
        description={product.description}
        visualVariant="phonecase"
        visual={<PhonecaseCard size="big" image_url={product.image_url} />}
        highlights={[
          {
            icon: Shield,
            title: "محافظت از موبایل",
            description: "بدنه مقاوم + لبه‌های ضربه‌گیر",
          },
          {
            icon: Smartphone,
            title: "چاپ پیشرفته",
            description: "رنگ ثابت و باکیفیت (با مراقبت حداقلی!)",
          },
        ]}
        faqItems={[
          {
            id: "material",
            question: "جنس قاب چجوریه؟",
            answer: (
              <>
                جنس قاب‌ها پلاستیک محکم و انعطاف‌پذیره با یه سطح فلزی نازک که
                طرح روش چاپ میشه. بعضی مدل‌ها هم پلاستیک فشرده‌‌ست و مراقبت
                بیشتری می‌خواد.
                <br />
                اکثر قاب‌ها دور گوشی رو کامل می‌پوشونن.
                <br />
                قاب‌های آیفون اکثرا محافظ لنز دارن.
              </>
            ),
          },
          {
            id: "shipping",
            question: "کی به دستم میرسه؟",
            answer: (
              <>
                آماده‌سازی قاب‌ها حدود ۵ تا ۱۰ روز ظول میکشه و بعد ارسال میشه.
                <br />
                وضعیت سفارش رو از سایت میتونی پیگیری کنی.
              </>
            ),
          },
          {
            id: "returns",
            question: "اگه قابم خراب بود چی؟",
            answer: (
              <>
                قبل از ارسال کیفیت و سالم بودنش رو بررسی میکنیم اما اگه قاب فیت
                گوشیت نباشه یا کیفیتش بد باشه، می‌تونی برگشت بزنی و هزینه رو پس
                بگیری یا قاب جدید سفارش بدی.
              </>
            ),
          },
        ]}
        purchase={
          <PhoneCaseSelector
            productId={product.id}
            phoneCases={phoneCases || []}
            shouldIRender={should_i_render}
          />
        }
      />
    </>
  );
}
