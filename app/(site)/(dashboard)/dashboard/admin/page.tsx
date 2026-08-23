import { getCurrentUser, isAdmin } from "@/lib/auth-helpers";
import { OrderRepository, ProductRepository } from "@/lib/repositories";
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
  const user = await getCurrentUser();
  const admin = await isAdmin();

  if (!user) {
    redirect("/auth/login");
  }

  if (!admin) {
    redirect(notFound());
  }

  const orders = await OrderRepository.getAllWithItems();
  const products = await ProductRepository.getFeed("phonecase", 0, 10000, false);
  const posterProducts = await ProductRepository.getFeed("poster", 0, 10000, false);
  const totalProducts = products.length + posterProducts.length;

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
              مدیریت سفارش‌ها، تغییر وضعیت و کپی اطلاعات ارسال
            </p>
          </div>
          <Badge className="rounded-full bg-primary/10 text-primary">
            دسترسی محافظت‌شده
          </Badge>
        </div>
      </div>

      <Link href="admin/mng">
        <Card className="group transition-all duration-200 hover:border-primary/30 mb-4">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              همه محصولات
            </CardTitle>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-muted transition-colors group-hover:bg-primary/10">
              <ShoppingBasketIcon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
            </span>
          </CardHeader>
          <CardContent>
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
        <Card className="group transition-all duration-200 hover:border-primary/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              مجموع سفارش‌ها
            </CardTitle>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-muted transition-colors group-hover:bg-primary/10">
              <ClipboardList className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-bold tracking-tight">
                {totalOrders}
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              کل سفارش‌های کالکتینا
            </p>
          </CardContent>
        </Card>

        <Card className="group transition-all duration-200 hover:border-primary/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              در حال آماده سازی
            </CardTitle>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-muted transition-colors group-hover:bg-muted">
              <PackageCheck className="h-5 w-5 text-muted-foreground" />
            </span>
          </CardHeader>
          <CardContent>
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

        <Card className="group transition-all duration-200 hover:border-red-400/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold">آماده ثبت</CardTitle>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-muted transition-colors group-hover:bg-muted">
              <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            </span>
          </CardHeader>
          <CardContent>
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
