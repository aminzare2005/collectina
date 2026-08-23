"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Calendar, Clock, Copy, LinkIcon, Package } from "lucide-react";
import { TomanIcon } from "@/components/ui/toman-icon";
import OrderProgress from "./order-progress";
import PhonecaseCard from "./phonecaseCard";
import PosterCard from "./poster-card";
import { Input } from "./ui/input";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import {
  getStatusLabel,
  getStatusBadgeClass,
  toOrderStatus,
} from "@/lib/types/order-status";

type OrderItem = {
  id: string;
  product_name: string;
  product_price: number | string;
  quantity: number;
  phone_brand: string | null;
  phone_model: string | null;
  poster_atr: string | null;
  products: { image_url: string | null; type: string | null } | null;
};

export default function TrackPageClient({ order }: { order: any }) {
  const [postTrackId, setPostTrackId] = useState(order.track_post_id);
  const { toast } = useToast();
  const items: OrderItem[] = order.order_items ?? [];
  const os = toOrderStatus(order.status);
  const totalPrice = Number(order.total_amount) || 0;

  function copyPostTrack() {
    navigator.clipboard.writeText(postTrackId);
    toast({ title: "کد پیگیری پست کپی شد!" });
  }

  return (
    <div className="min-h-dvh w-full max-w-md mx-auto px-4 py-6 space-y-3 animate-in fade-in duration-500">
      {/* ── Header ── */}
      <Card className="shadow-none border-border bg-white dark:bg-card">
        <CardContent className="p-4">
          {/* Status */}
          <div className="flex justify-center mb-5">
            <span
              className={cn(
                "text-xs px-4 py-2 rounded-full font-semibold",
                getStatusBadgeClass(order.status),
              )}
            >
              {getStatusLabel(order.status)}
            </span>
          </div>

          {/* Track number */}
          <div className="text-center mb-4">
            <p className="text-[11px] text-muted-foreground mb-0.5">
              شماره سفارش
            </p>
            <p
              dir="ltr"
              className="text-2xl font-mono font-bold tracking-widest text-foreground"
            >
              #{order?.track_id}
            </p>
          </div>

          {/* Price */}
          <div className="text-center mb-4">
            <p className="text-2xl font-extrabold text-foreground inline-flex items-center gap-1">
              <span>{new Intl.NumberFormat("fa-IR").format(totalPrice)}</span>
              <TomanIcon className="size-4 text-foreground/60" />
            </p>
          </div>

          {/* Date */}
          <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Calendar size={12} />
              {new Date(order.created_at).toLocaleDateString("fa-IR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span className="text-border">•</span>
            <span className="inline-flex items-center gap-1">
              <Clock size={12} />
              {new Date(order.created_at).toLocaleTimeString("fa-IR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ── Post tracking (delivered only) ── */}
      {order.status === "delivered" && order.track_post_id && (
        <Card className="shadow-none py-0 border-border bg-indigo-200 dark:bg-card">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              کد پیگیری پست
            </h3>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                dir="ltr"
                value={postTrackId}
                onChange={(e) => setPostTrackId(e.target.value)}
                className="border-border bg-background font-bold"
              />
              <Button
                variant="default"
                size="icon"
                className="size-10 shrink-0"
                onClick={copyPostTrack}
              >
                <Copy className="size-4" />
              </Button>
            </div>
            <Link
              target="_blank"
              href={`https://tracking.post.ir/?id=${postTrackId}`}
              className="block mt-2"
            >
              <Button
                variant="ghost"
                size="lg"
                className="w-full hover:bg-background/20 gap-2"
              >
                <LinkIcon className="size-3.5" />
                پیگیری از سایت اداره پست
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* ── Timeline ── */}
      <Card className="shadow-none border-border bg-white dark:bg-card">
        <CardContent className="px-4 pt-2 pb-2">
          <OrderProgress status={order.status} />
        </CardContent>
      </Card>

      {/* ── Products ── */}
      {items.length > 0 && (
        <Card className="shadow-none border-border bg-white dark:bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">
                اقلام سفارش
              </h3>
              <span className="text-xs text-muted-foreground">
                {items.length} عدد
              </span>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => {
                const imageUrl = item.products?.image_url || undefined;
                const type = item.products?.type;
                const isPhonecase = type === "phonecase";
                const spec = isPhonecase
                  ? [item.phone_brand, item.phone_model]
                      .filter(Boolean)
                      .join(" · ")
                  : item.poster_atr || "پوستر";
                const price = Number(item.product_price) || 0;

                return (
                  <div
                    key={item.id || index}
                    className="flex items-stretch gap-3 p-2 rounded-lg bg-background border border-border"
                  >
                    {/* Product card thumbnail */}
                    <div className="relative w-14 flex-shrink-0 overflow-hidden rounded-md border border-border/60">
                      {isPhonecase ? (
                        <PhonecaseCard
                          image_url={imageUrl}
                          name={item.product_name}
                          size="small"
                          quality="low"
                        />
                      ) : (
                        <PosterCard
                          image_url={imageUrl}
                          name={item.product_name}
                          size="small"
                          quality="low"
                        />
                      )}
                      {item.quantity > 1 && (
                        <div className="absolute top-0.5 left-0.5 z-50 flex items-center justify-center size-4 rounded-full bg-foreground text-background text-[8px] font-bold">
                          {item.quantity}
                        </div>
                      )}
                    </div>

                    {/* Info + price */}
                    <div className="flex-1 min-w-0 flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.product_name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {spec}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-foreground whitespace-nowrap flex items-center gap-0.5 mr-2">
                        <span>
                          {new Intl.NumberFormat("fa-IR").format(price)}
                        </span>
                        <TomanIcon className="size-2.5" />
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total */}
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
              <span className="text-sm text-muted-foreground">مجموع</span>
              <p className="text-base font-bold text-foreground flex items-center gap-1">
                <span>{new Intl.NumberFormat("fa-IR").format(totalPrice)}</span>
                <TomanIcon className="size-3" />
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Back ── */}
      <div className="pt-2 pb-8">
        <Link href="/" target="_blank" className="block">
          <Button variant="outline" className="w-full gap-2">
            <LinkIcon className="size-4" />
            بازگشت به کالکتینا
          </Button>
        </Link>
      </div>
    </div>
  );
}
