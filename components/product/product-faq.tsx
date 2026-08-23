import type { ReactNode } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export type ProductFaqItem = {
  id: string;
  question: string;
  answer: ReactNode;
};

type Props = {
  items: ProductFaqItem[];
  title?: string;
};

export function ProductFaq({ items, title = "سوالات متداول" }: Props) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <Accordion type="single" collapsible className="w-full rounded-xl border border-border px-1">
        {items.map((item) => (
          <AccordionItem
            key={item.id}
            value={item.id}
            className="border-border/60 px-3"
          >
            <AccordionTrigger className="text-sm text-foreground hover:no-underline py-3.5">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
