import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProductHighlight = {
  icon: LucideIcon;
  title: string;
  description: string;
};

type Props = {
  items: ProductHighlight[];
  className?: string;
};

export function ProductHighlights({ items, className }: Props) {
  return (
    <ul className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", className)}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <li
            key={item.title}
            className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/30 p-3.5"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted border border-border/50">
              <Icon className="size-4 text-foreground/80" aria-hidden />
            </span>
            <span className="min-w-0">
              <p className="text-sm font-medium">{item.title}</p>
              <p className="mt-0.5 text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
