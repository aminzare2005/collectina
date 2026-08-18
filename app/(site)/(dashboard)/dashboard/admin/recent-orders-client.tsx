"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  Copy,
  MousePointerClick,
  PackageCheck,
  ShieldCheck,
  AlertTriangle,
  XCircle,
} from "lucide-react";

export type AdminOrder = {
  id: string;
  created_at: string;
  status: string | null;
  track_id: number | null;
  total_amount: number | null;
  receiver_name: string | null;
  phone_number: string | null;
  shipping_city: string | null;
  shipping_address: string | null;
  shipping_postal_code: string | null;
  note?: string | null;
  order_items:
    | {
        id: string;
        phone_model: string | null;
        poster_atr: string | null;
        product_name: string | null;
        products: { image_url: string | null } | null;
      }[]
    | null;
};

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  paid: "bg-green-100 text-green-700",
  outofstock: "bg-rose-100 text-rose-700",
  processing: "bg-blue-100 text-blue-700",
  ready: "bg-indigo-100 text-indigo-700",
  delivered: "bg-emerald-100 text-emerald-700",
  returned: "bg-orange-100 text-orange-700",
  canceled: "bg-gray-200 text-gray-700",
  refunded: "bg-teal-100 text-teal-700",
};

const statusLabels: Record<string, string> = {
  pending: "در انتظار پرداخت",
  paid: "پرداخت شده",
  outofstock: "اتمام موجودی",
  processing: "در حال پردازش",
  ready: "آماده ارسال",
  delivered: "ارسال شد",
  returned: "مرجوع شده",
  canceled: "لغو شده",
  refunded: "بازپرداخت شده",
};

const statusAccent: Record<string, string> = {
  pending: "from-yellow-500/10",
  paid: "from-primary/12",
  outofstock: "from-rose-500/12",
  processing: "from-blue-500/12",
  ready: "from-indigo-500/12",
  delivered: "from-emerald-500/10",
  returned: "from-orange-500/10",
  canceled: "from-zinc-500/10",
  refunded: "from-teal-500/10",
};

const statusIcon: Record<string, React.ElementType> = {
  pending: MousePointerClick,
  paid: ShieldCheck,
  outofstock: AlertTriangle,
  processing: PackageCheck,
  ready: PackageCheck,
  delivered: PackageCheck,
  returned: PackageCheck,
  canceled: XCircle,
  refunded: ShieldCheck,
};

type RecentOrdersClientProps = {
  orders: AdminOrder[];
};

export default function RecentOrdersClient({
  orders,
}: RecentOrdersClientProps) {
  const { toast } = useToast();
  const hasOrders = orders.length > 0;

  // UI summary lines (not the copy payload)
  const getOrderItemLines = (order: AdminOrder) => {
    const items = order.order_items ?? [];

    return items.length > 0
      ? items.map((item) => {
          const model =
            item.phone_model?.trim() || item.poster_atr?.trim() || "نامشخص";
          const productName = item.product_name?.trim() || "نامشخص";
          return `${model} - ${productName}`;
        })
      : ["نامشخص - نامشخص"];
  };

  const getOrderItemPayloadLines = (order: AdminOrder) => {
    const items = order.order_items ?? [];

    if (items.length === 0) {
      return ["1: تصویر پیدا نشد", "1: نامشخص - نامشخص"];
    }

    return items.flatMap((item, idx) => {
      const n = idx + 1;

      const model =
        item.phone_model?.trim() || item.poster_atr?.trim() || "نامشخص";
      const productName = item.product_name?.trim() || "نامشخص";

      const imageUrl = item.products?.image_url?.trim() || "تصویر پیدا نشد";

      return [`${n}: ${imageUrl}`, `${model} - ${productName}`];
    });
  };

  const formattedOrders = useMemo(
    () =>
      orders.map((order) => {
        const orderItemLines = getOrderItemLines(order);
        const orderItemSummary = orderItemLines.join("، ");

        const itemPayloadLines = getOrderItemPayloadLines(order);

        const receiverName = order.receiver_name ?? "نامشخص";
        const phoneNumber = order.phone_number ?? "نامشخص";
        const cityAddress = [order.shipping_city, order.shipping_address]
          .filter(Boolean)
          .join(" ")
          .trim();
        const postalCode = order.shipping_postal_code ?? "نامشخص";

        const payload = [
          ...itemPayloadLines,
          "",
          receiverName,
          phoneNumber,
          "",
          cityAddress || "نامشخص",
          postalCode,
        ].join("\n");

        return { order, payload, orderItemLines, orderItemSummary };
      }),
    [orders],
  );

  const handleCopy = async (payload: string) => {
    try {
      await navigator.clipboard.writeText(payload);
      toast({
        title: "کپی شد",
        description: "اطلاعات سفارش در کلیپ‌بورد قرار گرفت.",
      });
    } catch {
      toast({
        title: "کپی انجام نشد",
        description: "مرورگر اجازه کپی نداد.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="relative overflow-hidden border-0 bg-transparent">
      <CardHeader className="relative mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg">سفارش‌های اخیر</CardTitle>
          <p className="text-sm text-muted-foreground">
            روی هر سفارش کلیک کن تا اطلاعات ارسال کپی شود.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-muted/60 ring-1 ring-border/60">
            <MousePointerClick className="h-4 w-4" />
          </span>
          کلیک برای کپی
        </div>
      </CardHeader>

      <div className="relative px-0">
        {!hasOrders ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-background/40 p-8 text-center text-sm text-muted-foreground">
            هنوز سفارشی ثبت نشده است.
          </div>
        ) : (
          <div className="space-y-3">
            {formattedOrders.map(
              ({ order, payload, orderItemLines, orderItemSummary }) => {
                const label =
                  (order.status && statusLabels[order.status]) || "نامشخص";
                const badgeStyle =
                  (order.status && statusStyles[order.status]) ||
                  "bg-zinc-100 text-zinc-700";

                const createdAt = new Date(order.created_at).toLocaleDateString(
                  "fa-IR",
                  { year: "numeric", month: "long", day: "numeric" },
                );

                const price = new Intl.NumberFormat("fa-IR").format(
                  order.total_amount ?? 0,
                );

                const accent =
                  (order.status && statusAccent[order.status]) ||
                  "from-muted/30";

                const Icon = (order.status && statusIcon[order.status]) || Copy;

                return (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => handleCopy(payload)}
                    className="group w-full text-right"
                  >
                    <div
                      className={cn(
                        "relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/50",
                        "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:border-primary/40",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
                        // paid orders get a slightly stronger default emphasis
                        order.status === "paid" &&
                          "ring-1 ring-primary/20 border-primary/25",
                      )}
                    >
                      {/* hover + status accent wash */}
                      <div
                        className={cn(
                          "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
                          "bg-gradient-to-br",
                          accent,
                          "via-transparent to-transparent",
                        )}
                      />

                      <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-muted/60 ring-1 ring-border/60 transition-colors group-hover:bg-primary/10">
                              <Icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                            </span>

                            <p className="font-mono text-lg font-semibold">
                              #{order.track_id ?? "—"}
                            </p>

                            <Badge className={cn("rounded-full", badgeStyle)}>
                              {label}
                            </Badge>

                            <span className="ml-auto inline-flex items-center gap-2 rounded-full bg-muted/40 px-3 py-1 text-xs text-muted-foreground ring-1 ring-border/60 md:hidden">
                              <CalendarDays className="h-4 w-4" />
                              {createdAt}
                            </span>
                          </div>

                          <div className="hidden items-center gap-2 text-xs text-muted-foreground md:flex">
                            <CalendarDays className="h-4 w-4" />
                            {createdAt}
                          </div>
                        </div>

                        <div className="flex flex-col items-start gap-2 md:items-end">
                          <p
                            dir="ltr"
                            className="line-clamp-1 max-w-[28rem] overflow-hidden text-ellipsis text-end text-sm text-muted-foreground"
                          >
                            {orderItemSummary}
                          </p>

                          <p className="text-sm font-semibold">{price} تومان</p>
                        </div>
                      </div>

                      <div className="relative mt-4 space-y-2 text-xs text-muted-foreground">
                        <div className="space-y-1">
                          {orderItemLines.map((line, index) => (
                            <p key={`${order.id}-${index}`}>{line}</p>
                          ))}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <span>
                            {order.receiver_name ?? "نامشخص"}
                            {" • "}
                            {order.phone_number ?? "—"}
                          </span>
                        </div>
                      </div>

                      {order.note && (
                        <div className="bg-yellow-200 text-black text-sm mt-4 w-full p-2 rounded-md">
                            {order.note}
                        </div>
                      )}

                      {/* subtle bottom highlight */}
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    </div>
                  </button>
                );
              },
            )}
          </div>
        )}
      </div>
    </div>
  );
}
