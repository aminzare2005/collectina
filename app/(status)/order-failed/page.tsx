import { getCurrentUser } from "@/lib/auth-helpers";
import { OrderRepository } from "@/lib/repositories";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Package, CreditCard, Clock, XCircleIcon } from "lucide-react";
import { redirect } from "next/navigation";
import type { Order } from "@/lib/types/database";

// ===========================
// Helper Functions
// ===========================

const formatNumber = (n: number): string => 
  new Intl.NumberFormat("fa-IR").format(n);

const formatOrderId = (id: string): string => 
  id.slice(0, 8).toUpperCase();

// ===========================
// Main Component
// ===========================

export default async function OrderFailedPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId: string }>;
}) {
  // Await searchParams (Next.js 15+)
  const params = await searchParams;
  
  // Check authentication
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch order with proper typing
  const order = await OrderRepository.getById(params.orderId);

  if (!order) {
    console.error("Order not found:", params.orderId);
    redirect("/");
  }

  // Verify order belongs to user
  if (order.user_id !== user.id) {
    redirect("/");
  }

  const formattedTotal = formatNumber(order.total_amount);
  const displayOrderId = formatOrderId(order.id);

  return (
    <div className="w-full">
      <div className="absolute top-0 left-0 right-0 bg-linear-to-b dark:from-red-500/10 from-red-500/30 to-background h-80 -z-50" />
      <div className="w-full">
        <div>
          {/* Header with gradient background */}
          <div className="pb-8">
            <CardHeader className="text-center pt-8">
              {/* Animated failed icon */}
              <div className="mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-red-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-red-500 shadow-lg">
                  <XCircleIcon
                    className="h-12 w-12 text-white"
                    strokeWidth={2.5}
                  />
                </div>
              </div>

              <CardTitle className="text-3xl font-bold bg-linear-to-l from-red-700 to-red-600 bg-clip-text text-transparent">
                ناموفق!
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                مشکلی پیش اومد و نتونستیم سفارشت رو بگیریم!
              </p>
            </CardHeader>
          </div>

          <CardContent className="space-y-6 px-6 pb-8 -mt-4">
            {/* Order details card */}
            <div className="rounded-xl bg-card p-6 shadow-inner">
              <div className="grid gap-4">
                <div className="flex items-center justify-between pb-3 border-b">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-foreground/80" />
                    <span className="text-sm text-foreground/80">
                      شماره سفارش:
                    </span>
                  </div>
                  <span className="font-mono font-bold text-foreground text-lg">
                    #{displayOrderId}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-foreground/80" />
                    <span className="text-sm text-foreground/80">مبلغ:</span>
                  </div>
                  <span className="font-bold text-foreground text-lg">
                    {formattedTotal} تومان
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-foreground/80" />
                    <span className="text-sm text-foreground/80">
                      وضعیت پرداخت:
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 dark:bg-red-500/10 text-red-700 font-semibold text-sm">
                    <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                    ناموفق
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm text-center text-muted-foreground mt-2">
              اگه مبلغی از حسابت کم شده، تا ۷۲ ساعت دیگه به حسابت برمیگرده.
              <br />
              درصورتی که به کمک نیاز داری میتونی با پشتیبانی در ارتباط باشی.
            </p>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                asChild
                className="bg-foreground text-background shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Link href="/support">تماس با پشتیبانی</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border transition-all duration-200"
              >
                <Link href="/">بازگشت به فروشگاه</Link>
              </Button>
            </div>
          </CardContent>
        </div>
      </div>
    </div>
  );
}