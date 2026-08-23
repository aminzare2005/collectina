import Link from "next/link";
import { Frame, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  showPoster?: boolean;
  showPhonecase?: boolean;
};

export default function HomeCategoryNav({
  showPoster = true,
  showPhonecase = true,
}: Props) {
  const items = [
    showPoster && {
      href: "/poster",
      title: "پوستر",
      description: "طرح‌های دیواری",
      icon: ImageIcon,
    },
    showPhonecase && {
      href: "/phonecase",
      title: "قاب موبایل",
      description: "طرح‌های آماده",
      icon: Frame,
    },
  ].filter(Boolean) as {
    href: string;
    title: string;
    description: string;
    icon: typeof ImageIcon;
  }[];

  if (items.length < 2) return null;

  return (
    <nav
      aria-label="دسته‌بندی محصولات"
      className="grid grid-cols-2 gap-3 md:gap-4"
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5",
              "transition-colors hover:bg-card/70 active:scale-[0.99]",
              "min-h-14",
            )}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
              <Icon className="size-5 text-foreground/80" aria-hidden />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="font-semibold leading-tight">{item.title}</span>
              <span className="text-xs text-muted-foreground">
                {item.description}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
