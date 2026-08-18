import type { ReactNode } from "react";
import { ProductBreadcrumbs } from "./product-breadcrumbs";
import { ProductHighlights, type ProductHighlight } from "./product-highlights";
import { ProductFaq, type ProductFaqItem } from "./product-faq";
import { ProductVisualStage } from "./product-visual-stage";
import { cn } from "@/lib/utils";

type Props = {
  categoryHref: string;
  categoryLabel: string;
  categoryBadge: string;
  productName: string;
  description?: string | null;
  visualVariant: "poster" | "phonecase";
  visual: ReactNode;
  highlights: ProductHighlight[];
  faqItems: ProductFaqItem[];
  purchase: ReactNode;
  className?: string;
};

export function ProductDetailShell({
  categoryHref,
  categoryLabel,
  categoryBadge,
  productName,
  description,
  visualVariant,
  visual,
  highlights,
  faqItems,
  purchase,
  className,
}: Props) {
  return (
    <div className={cn("pb-36 md:pb-10", className)}>
      <ProductBreadcrumbs
        categoryHref={categoryHref}
        categoryLabel={categoryLabel}
        productName={productName}
      />

      <div className="mt-5 flex w-full flex-col gap-8 md:mt-6 md:grid md:grid-cols-3 md:justify-center md:gap-x-8 md:gap-y-8 lg:gap-x-12">
        <div className="flex w-full justify-center md:justify-center md:pt-1">
          <ProductVisualStage variant={visualVariant}>
            {visual}
          </ProductVisualStage>
        </div>

        <div className="flex w-full flex-col gap-6 md:gap-7 md:col-span-2">
          <header className="space-y-3">
            <span className="inline-flex rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-medium">
              {categoryBadge}
            </span>
            <h1
              dir="auto"
              className="text-3xl font-bold leading-tight tracking-tight md:text-4xl lg:text-5xl"
            >
              {productName}
            </h1>
            {description ? (
              <p
                dir="auto"
                className="max-w-prose text-base leading-relaxed text-foreground/80"
              >
                {description}
              </p>
            ) : null}
          </header>

          <ProductHighlights items={highlights} />

          <section aria-label="انتخاب و خرید" className="space-y-4">
            <div className="space-y-1 px-1">
              <h2 className="text-base font-semibold">انتخاب و خرید</h2>
              <p className="text-xs text-muted-foreground">
                {visualVariant === "poster"
                  ? "سایز رو انتخاب کن و ببرش توی سبد"
                  : "برند و مدل گوشیت رو درست انتخاب کن"}
              </p>
            </div>
            {purchase}
          </section>

          <ProductFaq items={faqItems} />
        </div>
      </div>
    </div>
  );
}
