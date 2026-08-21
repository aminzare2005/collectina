import { getCurrentUser } from "@/lib/auth-helpers";
import { OrderRepository } from "@/lib/repositories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  CheckCircle2,
  Package,
  CreditCard,
} from "lucide-react";
import { redirect } from "next/navigation";
import { Order } from "@/lib/types/database";

// ===========================
// Helper Functions
// ===========================

const formatNumber = (n: number): string => 
  new Intl.NumberFormat("fa-IR").format(n);

// ===========================
// Main Component
// ===========================

export default async function OrderSuccessPage({
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

  return (
    <div className="w-full">
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-green-500/20 to-background h-80 -z-50" />
      <div className="w-full">
        <div>
          {/* Header with gradient background */}
          <div className="pb-8">
            <CardHeader className="text-center pt-8">
              {/* Animated success icon */}
              <div className="mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg">
                  <CheckCircle2
                    className="h-12 w-12 text-white"
                    strokeWidth={2.5}
                  />
                </div>
              </div>

              <CardTitle className="text-3xl font-bold bg-gradient-to-l from-green-700 to-emerald-600 bg-clip-text text-transparent">
                موفق!
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                سفارش شما با موفقیت ثبت شد.
                <br />
                از خرید شما متشکریم
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
                    #{order.track_id}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-foreground/80" />
                    <span className="text-sm text-foreground/80">
                      مبلغ پرداختی:
                    </span>
                  </div>
                  <span className="font-bold text-foreground text-lg">
                    {formattedTotal} تومان
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <Link
                target="_blank"
                href={`/track/${order.track_id}`}
                className="w-full"
              >
                <Button
                  variant={"outline"}
                  className="flex gap-1 items-center w-full text-white from-indigo-600 to-violet-600 bg-gradient-to-br"
                >
                  پـیــگیری ســفارش
                  <div className="bg-white/20 text-white border rounded-lg flex items-center gap-1 px-1.5 animate-pulse">
                    زنده
                    <div className="size-2 mt-0.5 rounded-full bg-white"></div>
                  </div>
                </Button>
              </Link>
              <Link href="/" className="w-full">
                <Button variant="outline" className="w-full">
                  بازگشت به فروشگاه
                </Button>
              </Link>
            </div>
          </CardContent>
        </div>
      </div>
    </div>
  );
}