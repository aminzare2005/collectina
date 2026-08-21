import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Clock, Send } from "lucide-react";

type Props = {
  title: string;
  description: string;
};

export function ProductUnavailableNotice({ title, description }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
        <div className="rounded-lg bg-amber-500/20 p-1.5">
          <Clock className="size-4 text-amber-600" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-amber-800">{title}</p>
          <p className="text-xs leading-relaxed text-amber-700/80">
            {description}
          </p>
        </div>
      </div>
      <Button variant="secondary" className="h-12 w-full gap-2" asChild>
        <Link href="https://t.me/CollectinaShop">
          <Send className="size-4" />
          عضویت در کانال تلگرام
        </Link>
      </Button>
    </div>
  );
}
