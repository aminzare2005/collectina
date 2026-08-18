import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ClipboardList,
  PackageCheck,
  ShieldCheck,
  ShoppingBasketIcon,
} from "lucide-react";
import RecentOrdersClient, {
  AdminOrder,
} from "@/app/(site)/(dashboard)/dashboard/admin/recent-orders-client";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  if (user.phone !== process.env.NEXT_PUBLIC_ADMIN_PHONE_NUMBER) {
    redirect(notFound());
  }

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      created_at,
      status,
      track_id,
      total_amount,
      receiver_name,
      phone_number,
      shipping_city,
      shipping_address,
      shipping_postal_code,
      note,
      order_items (
        id,
        phone_model,
        poster_atr,
        product_name,
        products (
          image_url
        )
      )
    `,
    )
    .order("created_at", { ascending: false });

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("*");

  if (error || productsError) {
    console.error(error);
  }

  const totalProducts = products?.length;

  const recentOrders = (orders ?? []) as unknown as AdminOrder[];
  const totalOrders = recentOrders.length;
  const processingOrders = recentOrders.filter(
    (order) => order.status === "processing",
  ).length;
  const paidOrders = recentOrders.filter(
    (order) => order.status === "paid",
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">داشبورد ادمین</h1>
            <p className="text-sm text-muted-foreground">
              وضعیت سفارش‌های اخیر و کپی سریع اطلاعات ارسال
            </p>
          </div>
          <Badge className="rounded-full bg-primary/10 text-primary">
            دسترسی محافظت‌شده
          </Badge>
        </div>
      </div>

      <Link href={"admin/mng"}>
        <Card className="group relative overflow-hidden border border-border/60 bg-card/50 backdrop-blur supports-backdrop-filter:bg-card/50 shadow-sm transition-all duration-300 mb-4">
          <div className="pointer-events-none absolute inset-0 opacity-30 transition-opacity duration-300 group-hover:opacity-80 bg-linear-to-br from-green-300/10 via-transparent to-transparent" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              همه محصولات
            </CardTitle>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-muted/60 ring-1 ring-border/60 transition-colors group-hover:bg-primary/10">
              <ShoppingBasketIcon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
            </span>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex items-end justify-between">
              <div className="text-3xl font-bold tracking-tight">
                {totalProducts}
              </div>
            </div>
            <p className="mt-2 text-xs flex items-center gap-1 text-muted-foreground">
              مدیریت محصولات و اتریبیوت ها
              <ArrowLeft size={14} />
            </p>
          </CardContent>
        </Card>
      </Link>

      <div className="grid gap-4 md:grid-cols-3">
        {/* مجموع سفارش‌ها */}
        <Card className="group relative overflow-hidden border border-border/60 bg-card/60 backdrop-blur supports-backdrop-filter:bg-card/50 shadow-sm transition-all duration-300">
          <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-80 bg-linear-to-br from-primary/10 via-transparent to-transparent" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              مجموع سفارش‌ها
            </CardTitle>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-muted/60 ring-1 ring-border/60 transition-colors group-hover:bg-primary/10">
              <ClipboardList className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
            </span>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex items-end justify-between">
              <div className="text-3xl font-bold tracking-tight">
                {totalOrders}
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              کل سفارش‌های ویلون فارسی
            </p>
          </CardContent>
        </Card>

        {/* در حال آماده‌سازی */}
        <Card className="group relative overflow-hidden border border-border/60 bg-card/60 backdrop-blur supports-backdrop-filter:bg-card/50 shadow-sm transition-all duration-300">
          <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-80 bg-linear-to-br from-primary/10 via-transparent to-transparent" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              در حال آماده سازی
            </CardTitle>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-muted/60 ring-1 ring-border/60 transition-colors group-hover:bg-muted">
              <PackageCheck className="h-5 w-5 text-muted-foreground" />
            </span>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex items-end justify-between">
              <div className="text-3xl font-bold tracking-tight">
                {processingOrders}
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              سفارش‌های درحال آماده سازی
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border border-border/60 bg-card/60 backdrop-blur supports-backdrop-filter:bg-card/50 shadow-sm transition-all duration-300">
          <div className="pointer-events-none absolute inset-0 opacity-30 transition-opacity duration-300 group-hover:opacity-80 bg-linear-to-br from-red-500/10 via-transparent to-transparent" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold">آماده ثبت</CardTitle>
            </div>

            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-muted/60 ring-1 ring-border/60 transition-colors group-hover:bg-muted">
              <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            </span>
          </CardHeader>

          <CardContent className="relative">
            <div className="flex items-end justify-between">
              <div className="text-3xl font-bold flex gap-1 items-center tracking-tight text-foreground">
                {paidOrders}
                <div className="bg-red-500/40 font-medium text-sm border rounded-lg flex items-center gap-1 py-0.5 px-1.5 animate-pulse">
                  مهم
                </div>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              سفارش‌های آماده برای ثبت
            </p>
          </CardContent>
        </Card>
      </div>

      <RecentOrdersClient orders={recentOrders} />
    </div>
  );
}
