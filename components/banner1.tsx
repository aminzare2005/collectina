import Link from "next/link";
import { ArrowLeft } from "lucide-react";

function Banner1() {
  return (
    <Link
      href="/poster"
      className="
        group relative flex w-full items-center justify-between gap-4
        overflow-hidden rounded-2xl md:rounded-3xl
        border border-border/60 bg-muted/40
        px-5 py-6 md:px-8 md:py-8
        transition-colors hover:bg-muted/60
      "
    >
      <div className="relative z-10 flex max-w-md flex-col gap-1.5 text-start">
        <p className="text-xs font-medium text-muted-foreground md:text-sm">
          محصول جدید
        </p>
        <h2 className="text-xl font-bold tracking-tight md:text-3xl">
          پوستر دیواری
        </h2>
        <p className="text-sm text-muted-foreground md:text-base">
          طرح‌های مختلف، چاپ باکیفیت، آماده ارسال
        </p>
        <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium">
          مشاهده پوسترها
          <ArrowLeft
            className="size-4 transition-transform group-hover:-translate-x-0.5"
            aria-hidden
          />
        </span>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-linear-to-r from-foreground/5 to-transparent"
      />
    </Link>
  );
}

export default Banner1;
