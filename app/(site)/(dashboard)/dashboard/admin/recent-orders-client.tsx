"use client";

import { useMemo, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { TomanIcon } from "@/components/ui/toman-icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarDays,
  Copy,
  Check,
  Loader2,
  User,
  Phone,
  MapPin,
} from "lucide-react";
import {
  STATUS_LABELS,
  STATUS_BADGE_CLASSES,
  STATUS_ICONS,
  STATUS_TEXT_CLASSES,
  OrderStatus,
  toOrderStatus,
} from "@/lib/types/order-status";

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

const ALL_STATUSES = Object.keys(STATUS_LABELS) as OrderStatus[];

type RecentOrdersClientProps = {
  orders: AdminOrder[];
};

export default function RecentOrdersClient({ orders }: RecentOrdersClientProps) {
  const { toast } = useToast();
  const [localOrders, setLocalOrders] = useState(orders);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Keep in sync if parent re-renders with new orders
  useMemo(() => {
    setLocalOrders(orders);
  }, [orders]);

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
      localOrders.map((order) => {
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

        return { order, payload };
      }),
    [localOrders],
  );

  const handleCopy = async (payload: string, orderId: string) => {
    try {
      await navigator.clipboard.writeText(payload);
      toast({ title: "اطلاعات ارسال کپی شد ✓" });
    } catch {
      toast({
        title: "مرورگر اجازه کپی نداد.",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = useCallback(
    async (orderId: string, newStatus: string) => {
      setUpdatingStatus(orderId);
      try {
        const res = await fetch(`/api/orders/${orderId}/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "خطا در بروزرسانی");
        }

        setLocalOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, status: newStatus } : o,
          ),
        );

        toast({ title: `وضعیت به «${STATUS_LABELS[newStatus as OrderStatus]}» تغییر کرد` });
      } catch (err) {
        toast({
          title: err instanceof Error ? err.message : "خطا در بروزرسانی وضعیت",
          variant: "destructive",
        });
      } finally {
        setUpdatingStatus(null);
      }
    },
    [toast],
  );

  return (
    <div className="relative overflow-hidden border-0 bg-transparent">
      <CardHeader className="relative mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg">سفارش‌های اخیر</CardTitle>
          <p className="text-sm text-muted-foreground">
            با دکمه کپی، اطلاعات ارسال را سریع کپی کنید.
          </p>
        </div>
      </CardHeader>

      <div className="relative px-0">
        {localOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-background/40 p-8 text-center text-sm text-muted-foreground">
            هنوز سفارشی ثبت نشده است.
          </div>
        ) : (
          <div className="space-y-3">
            {formattedOrders.map(({ order, payload }) => {
              const os = toOrderStatus(order.status);
              const label = os ? STATUS_LABELS[os] : "نامشخص";
              const badgeStyle = os
                ? STATUS_BADGE_CLASSES[os]
                : "bg-zinc-100 text-zinc-700";
              const textStyle = os
                ? STATUS_TEXT_CLASSES[os]
                : "text-zinc-700";

              const createdAt = new Date(order.created_at).toLocaleDateString(
                "fa-IR",
                { year: "numeric", month: "long", day: "numeric" },
              );

              const price = new Intl.NumberFormat("fa-IR").format(
                Number(order.total_amount) || 0,
              );

              const Icon = os ? STATUS_ICONS[os] : Copy;
              const isUpdating = updatingStatus === order.id;

              return (
                <div
                  key={order.id}
                  className={cn(
                    "rounded-2xl border border-border bg-card p-4 transition-all duration-200",
                    order.status === "paid" &&
                      "ring-1 ring-primary/20 border-primary/25",
                  )}
                >
                  {/* Top row: track number + status + copy button */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Status icon */}
                      <span
                        className={cn(
                          "inline-flex size-9 shrink-0 items-center justify-center rounded-xl",
                          os ? STATUS_BADGE_CLASSES[os] : "bg-zinc-100 text-zinc-700",
                        )}
                      >
                        <Icon className="size-4" />
                      </span>

                      {/* Track number */}
                      <div className="min-w-0">
                        <p className="font-mono text-base font-bold truncate">
                          #{order.track_id ?? "—"}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <CalendarDays className="size-3" />
                          {createdAt}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Price */}
                      <span className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold">
                        <span>{price}</span>
                        <TomanIcon className="size-3" />
                      </span>

                      {/* Copy button */}
                      <button
                        type="button"
                        onClick={() => handleCopy(payload, order.id)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-background px-3 py-1.5 text-xs font-medium text-foreground",
                          "transition-all duration-150 hover:bg-accent hover:text-accent-foreground active:scale-95",
                        )}
                        title="کپی اطلاعات ارسال"
                      >
                        <Copy className="size-3.5" />
                        <span className="hidden sm:inline">کپی</span>
                      </button>
                    </div>
                  </div>

                  {/* Items summary */}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    {(order.order_items ?? []).map((item, i) => (
                      <span
                        key={item.id}
                        className="inline-flex items-center rounded-lg bg-muted/50 px-2 py-0.5"
                      >
                        {item.product_name?.trim() || "نامشخص"}
                        {item.phone_model
                          ? ` · ${item.phone_model}`
                          : item.poster_atr
                            ? ` · ${item.poster_atr}`
                            : ""}
                      </span>
                    ))}
                  </div>

                  {/* Info row: receiver + price (mobile) + status selector */}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <User className="size-3" />
                        {order.receiver_name ?? "نامشخص"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Phone className="size-3" />
                        {order.phone_number ?? "—"}
                      </span>
                      {order.shipping_city && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3" />
                          {order.shipping_city}
                        </span>
                      )}
                      {/* Price (mobile) */}
                      <span className="sm:hidden inline-flex items-center gap-1 font-semibold text-foreground">
                        <span>{price}</span>
                        <TomanIcon className="size-3" />
                      </span>
                    </div>

                    {/* Status selector */}
                    <div className="flex items-center gap-2">
                      {isUpdating && (
                        <Loader2 className="size-3 animate-spin text-muted-foreground" />
                      )}
                      <Select
                        value={os ?? "pending"}
                        onValueChange={(val) =>
                          handleStatusChange(order.id, val)
                        }
                        disabled={isUpdating}
                      >
                        <SelectTrigger
                          className={cn(
                            "h-8 w-auto min-w-[140px] rounded-lg border-border/60 text-xs font-medium",
                            badgeStyle,
                          )}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              <span className={cn("text-xs", STATUS_TEXT_CLASSES[s])}>
                                {STATUS_LABELS[s]}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Note */}
                  {order.note && (
                    <div className="mt-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs p-2 dark:bg-yellow-900/20 dark:border-yellow-800/40 dark:text-yellow-300">
                      {order.note}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
