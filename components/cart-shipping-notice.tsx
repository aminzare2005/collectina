import { Package } from "lucide-react";
import type { calculateCartShipping } from "@/lib/shipping";

type ShippingResult = ReturnType<typeof calculateCartShipping>;

type Props = {
  shipping: ShippingResult;
  postPricePerShipment: number;
};

const formatNumber = (n: number) => new Intl.NumberFormat("fa-IR").format(n);

export default function CartShippingNotice({
  shipping,
  postPricePerShipment,
}: Props) {
  if (shipping.shipmentCount <= 1) return null;

  const labels = shipping.groups.map((g) => g.label).join(" و ");

  const originHint =
    shipping.groups.some((g) => g.id === "poster") &&
    shipping.groups.some((g) => g.id === "phonecase")
      ? "پوسترها از مبدای خودمون و قاب‌های موبایل از کارگاه چاپ جدا ارسال می‌شن؛ "
      : "بخش‌های مختلف سفارش از مبداهای جدا ارسال می‌شن؛ ";

  return (
    <div
      className="flex gap-3 rounded-xl border border-border/60 bg-muted/35 px-3.5 py-3"
      role="note"
    >
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-background border border-border/60">
        <Package className="size-4 text-foreground/80" aria-hidden />
      </span>
      <div className="min-w-0 space-y-1 text-sm leading-relaxed">
        <p className="font-medium text-foreground">
          سفارشت در {formatNumber(shipping.shipmentCount)} مرسوله جدا ارسال
          می‌شه
        </p>
        <p className="text-muted-foreground">
          الان هم {labels} توی سبدته. {originHint}برای همین به‌ازای هر بخش یک
          هزینه ارسال ({formatNumber(postPricePerShipment)} تومان) محاسبه شده و
          جمعاً {formatNumber(shipping.total)} تومان می‌شه.
        </p>
      </div>
    </div>
  );
}
