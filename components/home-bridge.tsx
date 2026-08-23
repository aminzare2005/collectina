import { Package, ShieldCheck, Truck } from "lucide-react";

const items = [
  {
    icon: Package,
    title: "آماده‌سازی با دقت",
    text: "هر سفارش قبل از ارسال چک می‌شه",
  },
  {
    icon: Truck,
    title: "ارسال با پست",
    text: "پیگیری وضعیت سفارش از سایت",
  },
  {
    icon: ShieldCheck,
    title: "پشتیبانی تلگرام",
    text: "سوال داشتی، مستقیم پیام بده",
  },
];

export default function HomeBridge() {
  return (
    <section
      aria-label="مزایای خرید"
      className="rounded-2xl border border-border bg-card px-4 py-5 md:px-6 md:py-6"
    >
      <div className="mb-4 space-y-1 text-center md:mb-5 md:text-start">
        <h2 className="text-base font-semibold md:text-lg">
          چرا از کالکتینا؟
        </h2>
        <p className="text-sm text-muted-foreground">
          خرید ساده، ارسال مطمئن، پشتیبانی واقعی
        </p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.title} className="flex items-start gap-3">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-background border border-border/60">
                <Icon className="size-4 text-foreground/80" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">{item.title}</span>
                <span className="block text-xs text-muted-foreground leading-relaxed">
                  {item.text}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
