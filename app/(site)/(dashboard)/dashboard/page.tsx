import React from "react";
import { getCurrentUser, isAdmin } from "@/lib/auth-helpers";
import { OrderRepository } from "@/lib/repositories";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Package,
  ShoppingBag,
  Clock,
  Calendar,
  ArrowLeft,
  ShieldUserIcon,
  ShoppingBasketIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat-card";
import { TomanIcon } from "@/components/ui/toman-icon";

type Order = {
  id: string;
  created_at: string;
  total_amount: number | null;
  track_id: number;
  status:
    | "pending"
    | "paid"
    | "outofstock"
    | "processing"
    | "ready"
    | "delivered"
    | "returned"
    | "canceled"
    | "refunded"
    | string;
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const admin = await isAdmin();

  if (!user) {
    redirect("/auth/login");
  }

  const recentOrders = await OrderRepository.getByUserId(user.id);

  const formatPrice = (v: number | null | undefined): string =>
    new Intl.NumberFormat("fa-IR").format(v ?? 0);

  const totalSpent =
    recentOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) ||
    0;

  return (
    <>
      <div>
        {admin && (
          <div className="grid grid-cols-1 mb-4">
            <Link href="/dashboard/admin">
              <StatCard
                icon={<ShieldUserIcon className="h-6 w-6" />}
                title=""
                value="ادمین پنل"
                gradient="from-zinc-700 to-zinc-800"
              />
            </Link>
          </div>
        )}
        <div className="grid grid-cols-1 mb-4">
          <Link href="/cart">
            <StatCard
              icon={<ShoppingBasketIcon className="h-6 w-6" />}
              title=""
              value="سبد خرید"
              gradient="from-violet-600 to-blue-500"
            />
          </Link>
        </div>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatCard
            icon={<Clock className="h-6 w-6" />}
            title="مجموع سفارشات"
            value={totalSpent !== 0 ? <span className="inline-flex items-center gap-1"><span>{formatPrice(totalSpent)}</span><TomanIcon className="size-4" /></span> : "—"}
            gradient="from-orange-400 to-red-400"
          />

          <StatCard
            icon={<Package className="h-6 w-6" />}
            title="آخرین خرید"
            value={
              recentOrders &&
              recentOrders.length > 0 &&
              recentOrders[0]?.created_at
                ? new Date(recentOrders[0].created_at).toLocaleDateString(
                    "fa-IR",
                    {
                      day: "2-digit",
                      month: "long",
                    },
                  )
                : "—"
            }
            gradient="from-pink-400 to-violet-400"
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Recent Orders */}
          <section>
            <Card className="border-0 rounded-3xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ShoppingBag className="h-5 w-5" />
                    سفارش‌ها
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent>
                {recentOrders && recentOrders.length > 0 ? (
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <OrderItem
                        key={order.id}
                        order={order}
                        formatPrice={formatPrice}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="h-16 w-16 bg-muted/20 rounded-2xl flex items-center justify-center mx-auto">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <p className="font-semibold">هنوز سفارشی ثبت نکرده‌اید</p>
                      <p className="text-sm text-muted-foreground">
                        اولین خرید خود را تجربه کنید
                      </p>
                    </div>
                    <Button asChild className="rounded-full mt-2">
                      <Link href="/">مشاهده محصولات</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Discount Code Section */}
          {/* <section className="flex flex-col gap-4">
            <Card className="border-0 shadow-xl rounded-3xl overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="size-5 fill-yellow-400 text-yellow-400" />
                  کد تخفیف
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <EmptyCommon title="کد تخفیفی نداری!" icon={<Sparkles />} />
              </CardContent>
            </Card>
          </section> */}
        </div>
      </div>
    </>
  );
}

function OrderItem({
  order,
  formatPrice,
}: {
  order: Order;
  formatPrice: (v: number | null | undefined) => string;
}) {
  const date = new Date(order.created_at).toLocaleDateString("fa-IR");
  const time = new Date(order.created_at).toLocaleTimeString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const statusStyles: Record<string, { badge: string; iconBg: string }> = {
    pending: {
      badge: "bg-yellow-100 text-yellow-700",
      iconBg: "bg-yellow-100 text-yellow-600",
    },
    paid: {
      badge: "bg-green-100 text-green-700",
      iconBg: "bg-green-100 text-green-600",
    },
    outofstock: {
      badge: "bg-rose-100 text-rose-700",
      iconBg: "bg-rose-100 text-rose-600",
    },
    processing: {
      badge: "bg-blue-100 text-blue-700",
      iconBg: "bg-blue-100 text-blue-600",
    },
    ready: {
      badge: "bg-indigo-100 text-indigo-700",
      iconBg: "bg-indigo-100 text-indigo-600",
    },
    delivered: {
      badge: "bg-emerald-100 text-emerald-700",
      iconBg: "bg-emerald-100 text-emerald-600",
    },
    returned: {
      badge: "bg-orange-100 text-orange-700",
      iconBg: "bg-orange-100 text-orange-600",
    },
    canceled: {
      badge: "bg-gray-200 text-gray-700",
      iconBg: "bg-gray-200 text-gray-700",
    },
    refunded: {
      badge: "bg-teal-100 text-teal-700",
      iconBg: "bg-teal-100 text-teal-600",
    },
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
    refunded: "عودت وجه داده شد",
  };

  const status = order.status || "unknown";
  const styles = statusStyles[status] ?? {
    badge: "bg-zinc-100 text-zinc-700",
    iconBg: "bg-zinc-100 text-zinc-700",
  };
  const label = statusLabels[status] ?? "نامشخص";

  return (
    <div className="flex flex-col justify-between gap-4 p-4 rounded-2xl border bg-background">
      <div className="flex items-center gap-4 flex-1">
        <div dir="ltr" className="flex-1">
          <div className="flex flex-row items-center justify-between gap-3 mb-1">
            <div className="flex flex-col gap-1 items-start">
              <p className="font-mono text-xl font-semibold rounded-lg">
                #{order.track_id}
              </p>
              <span
                className={cn(
                  "text-xs px-2 py-1 rounded-lg font-medium",
                  styles.badge,
                )}
              >
                {label}
              </span>
            </div>
            <div dir="rtl">
              <p className="font-bold text-xl">
                <span className="inline-flex items-center gap-1"><span>{formatPrice(order.total_amount)}</span><TomanIcon className="size-4" /></span>
              </p>
              <div className="flex items-center gap-1 text-xs text-accent-foreground">
                <Calendar size={12} />
                <span>{date}</span>
                <span></span>
                <Clock size={12} />
                <span>{time}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-left flex items-center justify-between">
        <Link
          href={`/track/${order.track_id}`}
          target="_blank"
          className="w-full"
        >
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full gap-1 w-full text-xs"
          >
            پیگیری
            <ArrowLeft className="size-5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
