import Link from "next/link";
import { ChevronLeft } from "lucide-react";

type Props = {
  categoryHref: string;
  categoryLabel: string;
  productName: string;
};

export function ProductBreadcrumbs({
  categoryHref,
  categoryLabel,
  productName,
}: Props) {
  return (
    <nav
      aria-label="مسیر صفحه"
      className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground"
    >
      <Link href="/" className="transition-colors hover:text-foreground">
      کالکتینا
      </Link>
      <ChevronLeft className="size-3.5 opacity-50" aria-hidden />
      <Link
        href={categoryHref}
        className="transition-colors hover:text-foreground"
      >
        {categoryLabel}
      </Link>
      <ChevronLeft className="size-3.5 opacity-50" aria-hidden />
      <span className="truncate font-medium text-foreground">{productName}</span>
    </nav>
  );
}
