"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Calendar, Clock, Copy, LinkIcon } from "lucide-react";
import OrderProgress from "./order-progress";
import { Input } from "./ui/input";
import { useState } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import PhonecaseCard from "./phonecaseCard";
import PosterCard from "./poster-card";

export default function TrackPageClient({ order }: { order: any }) {
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
  const [postTrackId, setPostTrackId] = useState(order.track_post_id);
  const { toast } = useToast();

  function CopyCode() {
    navigator.clipboard.writeText(postTrackId);
    toast({
      title: "کد پیگیری پست کپی شد!",
    });
  }

  return (
    <>
      <div className="absolute top-0 left-0 right-0 bg-linear-to-b from-black/20 dark:from-white/10 opacity-80 animate-pulse to-background h-96 -z-50" />
      <div className="p-4 md:p-6 animate-in fade-in duration-300 w-full">
        <Card
          key={order.id}
          className="overflow-hidden shadow-none! bg-transparent! p-2! border-0"
        >
          <CardContent className="p-4">
            <div className="flex gap-4 flex-row items-start justify-between">
              <div className="flex flex-col">
                <p className="text-xl font-bold text-primary">
                  {new Intl.NumberFormat("fa-IR").format(order.total_amount)}{" "}
                  تومان
                </p>
                <p className="text-xs flex items-center gap-1 text-muted-foreground">
                  <Calendar size={12} />
                  {new Date(order.created_at).toLocaleDateString("fa-IR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                  <span></span>
                  <Clock size={12} />
                  <span className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleTimeString("fa-IR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </p>
              </div>

              <div className="flex flex-col items-end gap-1">
                <p
                  dir="ltr"
                  className="text-xl uppercase font-semibold font-mono"
                >
                  #{order?.track_id}
                </p>
                <span
                  className={cn("text-xs px-2 py-1 rounded-lg font-bold", {
                    "bg-yellow-100 text-yellow-700": order.status === "pending",
                    "bg-green-100 text-green-700": order.status === "paid",
                    "bg-rose-100 text-rose-700": order.status === "outofstock",
                    "bg-blue-100 text-blue-700": order.status === "processing",
                    "bg-indigo-100 text-indigo-700": order.status === "ready",
                    "bg-emerald-100 text-emerald-700":
                      order.status === "delivered",
                    "bg-orange-100 text-orange-700":
                      order.status === "returned",
                    "bg-gray-200 text-gray-700": order.status === "canceled",
                    "bg-teal-100 text-teal-700": order.status === "refunded",
                  })}
                >
                  {statusLabels[order.status] ?? "نامشخص"}
                </span>
              </div>
            </div>

            {order.status === "delivered" && (
              <div className="p-4 from-indigo-400 to-violet-500 bg-linear-to-br rounded-xl flex items-center flex-col gap-2">
                <Label className="text-xl">کد پیگیری پست</Label>
                <div className="w-full flex justify-center items-center gap-2">
                  <Input
                    id="post_track_id"
                    type="text"
                    placeholder="کد پیگیری پست"
                    readOnly
                    dir="ltr"
                    value={postTrackId}
                    onChange={(e) => setPostTrackId(e.target.value)}
                    max={24}
                    className="border-0 w-full md:w-77.5 bg-card/60! h-12 text-lg! md:text-xl! font-bold"
                  />
                  <Button
                    variant="default"
                    size="icon"
                    className="size-12! bg-card/60! text-foreground hover:bg-card/50!"
                    onClick={() => CopyCode()}
                  >
                    <Copy className="size-7" />
                  </Button>
                </div>
                <Link
                  target="_blank"
                  href={`https://tracking.post.ir/?id=${postTrackId}`}
                >
                  <Button variant={"outline"} className="flex items-center">
                    <LinkIcon />
                    پیگیری مستقیم از سایت اداره پست
                  </Button>
                </Link>
              </div>
            )}

            <OrderProgress status={order.status} />

            <div className="py-4 border-t grid grid-cols-2 gap-3 md:grid-cols-3 pointer-events-none">
              {order.order_items?.map((item: any, index: number) => 
                {
                  if (item.products?.type === "phonecase") {
                    return (
                      <div key={item.id || index} className="w-full">
                        <PhonecaseCard
                          image_url={item?.products?.image_url}
                          size="big"
                        />
                      </div>
                    )
                  } else if (item.products?.type === "poster") {
                    return (
                      <div key={item.id || index} className="w-full">
                        <PosterCard
                          image_url={item?.products?.image_url}
                          size="big"
                        />
                      </div>
                    )
                  }
                }
              )}
            </div>

            <div className="w-full flex flex-col gap-4 pt-4 border-t">
              <Link href="/" target="_blank" className="w-full">
                <Button variant="default" size="lg" className="w-full">
                  <LinkIcon />
                  بازگشت به کالکتینا
                </Button>
              </Link>
              {/* <Link href="/dashboard" target="_blank" className="w-full">
                <Button variant="outline" size="lg" className="w-full">
                  <LinkIcon />
                  داشبورد من
                </Button>
              </Link> */}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
