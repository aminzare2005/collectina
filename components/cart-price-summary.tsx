"use client";

import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { TomanIcon } from "@/components/ui/toman-icon";
import type { calculateCartShipping } from "@/lib/shipping";

type ShippingResult = ReturnType<typeof calculateCartShipping>;

const formatNumber = (n: number) => new Intl.NumberFormat("fa-IR").format(n);

type Props = {
  subtotal: number;
  shipping: ShippingResult;
  shippingPrice: number;
  discountAmount: number;
  finalTotal: number;
  /** موبایل: فقط مجموع نهایی؛ با ضربه باز می‌شود */
  collapsible?: boolean;
  className?: string;
};

function ShippingAmount({
  shipping,
  shippingPrice,
}: {
  shipping: ShippingResult;
  shippingPrice: number;
}) {
  if (shippingPrice === 0) {
    return (
      <p className="text-green-600">رایگان</p>
    );
  }

  if (shipping.shipmentCount > 1) {
    const feePer = shipping.groups[0]?.fee ?? 0;
    return (
      <p>
        {formatNumber(feePer)} × {formatNumber(shipping.shipmentCount)}
      </p>
    );
  }

  return <p className="inline-flex items-center gap-1"><span>{formatNumber(shippingPrice)}</span><TomanIcon className="size-3.5" /></p>;
}

function BreakdownRows({
  subtotal,
  shipping,
  shippingPrice,
  discountAmount,
}: {
  subtotal: number;
  shipping: ShippingResult;
  shippingPrice: number;
  discountAmount: number;
}) {
  return (
    <>
      <div className="flex justify-between">
        <p className="text-sm text-muted-foreground">جمع خرید:</p>
        <p className="inline-flex items-center gap-1"><span>{formatNumber(subtotal)}</span><TomanIcon className="size-3.5" /></p>
      </div>

      <div className="flex justify-between">
        <p className="text-sm text-muted-foreground">هزینه ارسال:</p>
        <ShippingAmount shipping={shipping} shippingPrice={shippingPrice} />
      </div>

      {discountAmount > 0 && (
        <div className="flex justify-between text-green-600">
          <p className="text-sm">تخفیف:</p>
          <p className="inline-flex items-center gap-1"><span>{formatNumber(discountAmount)}</span><TomanIcon className="size-3.5" /></p>
        </div>
      )}
    </>
  );
}

function FinalTotalRow({
  finalTotal,
  className,
}: {
  finalTotal: number;
  className?: string;
}) {
  return (
    <div className={cn("flex justify-between", className)}>
      <p className="font-semibold text-lg">مجموع نهایی:</p>
      <p className="text-xl font-bold md:text-2xl">
        <span className="inline-flex items-center gap-1"><span>{formatNumber(finalTotal)}</span><TomanIcon className="size-4" /></span>
      </p>
    </div>
  );
}

export default function CartPriceSummary({
  subtotal,
  shipping,
  shippingPrice,
  discountAmount,
  finalTotal,
  collapsible = false,
  className,
}: Props) {
  const [open, setOpen] = useState(false);

  if (!collapsible) {
    return (
      <div className={cn("flex flex-col w-full gap-1", className)}>
        <BreakdownRows
          subtotal={subtotal}
          shipping={shipping}
          shippingPrice={shippingPrice}
          discountAmount={discountAmount}
        />
        <FinalTotalRow
          finalTotal={finalTotal}
          className="border-t pt-2 mt-1"
        />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col w-full", className)}>
      {open && (
        <div className="flex flex-col gap-1 pb-2 mb-1 border-b border-border/60">
          <BreakdownRows
            subtotal={subtotal}
            shipping={shipping}
            shippingPrice={shippingPrice}
            discountAmount={discountAmount}
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 text-start"
      >
        <FinalTotalRow finalTotal={finalTotal} className="flex-1 min-w-0" />
        <ChevronDownIcon
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
    </div>
  );
}
