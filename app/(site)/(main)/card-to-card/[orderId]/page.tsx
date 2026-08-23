"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Copy,
  CreditCard,
  Loader2,
  Upload,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CardDetails {
  number: string;
  holderName: string;
}

interface OrderDetails {
  id: string;
  totalAmount: number;
  status: string;
}

type Step = "details" | "upload" | "success";

const formatNumber = (n: number | string): string =>
  new Intl.NumberFormat("fa-IR").format(Number(n) || 0);

const formatCardNumber = (card: string): string => {
  // Format as XXXX XXXX XXXX XXXX
  return card.replace(/(\d{4})/g, "$1 ").trim();
};

export default function CardToCardPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const orderId = params.orderId as string;

  const [step, setStep] = useState<Step>("details");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cardDetails, setCardDetails] = useState<CardDetails | null>(null);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  // Fetch order and card details
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [orderRes, cardRes] = await Promise.all([
          fetch(`/api/orders/${orderId}`),
          fetch("/api/payment/card-details"),
        ]);

        if (!orderRes.ok) {
          throw new Error("سفارش یافت نشد");
        }

        const orderData = await orderRes.json();
        setOrder(orderData);

        if (cardRes.ok) {
          const cardData = await cardRes.json();
          setCardDetails(cardData);
        }
      } catch (error) {
        console.error("Fetch error:", error);
        toast({
          title: "خطا",
          description: "اطلاعات سفارش قابل بارگذاری نیست",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [orderId]);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "کپی شد",
        description: `${label} با موفقیت کپی شد`,
      });
    } catch {
      toast({
        title: "خطا",
        description: "امکان کپی وجود ندارد",
        variant: "destructive",
      });
    }
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "خطا",
          description: "حجم فایل نباید بیشتر از ۵ مگابایت باشد",
          variant: "destructive",
        });
        return;
      }
      setReceipt(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitReceipt = async () => {
    if (!receipt) {
      toast({
        title: "خطا",
        description: "لطفاً تصویر رسید پرداخت را آپلود کنید",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Upload receipt
      const formData = new FormData();
      formData.append("file", receipt);
      formData.append("orderId", orderId);

      const uploadRes = await fetch("/api/payment/upload-receipt", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("خطا در آپلود تصویر");
      }

      const uploadData = await uploadRes.json();

      // Update order status
      const updateRes = await fetch(`/api/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "pending_card_verification",
          receiptUrl: uploadData.url,
        }),
      });

      if (!updateRes.ok) {
        throw new Error("خطا در بروزرسانی سفارش");
      }

      setStep("success");
    } catch (error) {
      console.error("Submit error:", error);
      toast({
        title: "خطا",
        description: error instanceof Error ? error.message : "مشکلی پیش آمد",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">سفارش یافت نشد</p>
        <Button onClick={() => router.push("/")}>بازگشت به صفحه اصلی</Button>
      </div>
    );
  }

  if (order.status !== "pending") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">
          این سفارش قبلاً پردازش شده است
        </p>
        <Button onClick={() => router.push("/")}>بازگشت به صفحه اصلی</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6 py-8">
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 text-sm">
        <span
          className={cn(
            "font-medium",
            step === "details" ? "text-foreground" : "text-muted-foreground",
          )}
        >
          اطلاعات پرداخت
        </span>
        <span className="text-muted-foreground">·</span>
        <span
          className={cn(
            "font-medium",
            step === "upload" || step === "success"
              ? "text-foreground"
              : "text-muted-foreground",
          )}
        >
          ارسال رسید
        </span>
      </div>

      {/* Step 1: Card Details */}
      {step === "details" && cardDetails && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl border border-border bg-background">
                <CreditCard className="size-5 text-foreground/80" />
              </span>
              <div>
                <p className="font-medium">اطلاعات کارت</p>
                <p className="text-sm text-muted-foreground">
                  مبلغ را به این کارت واریز کنید
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Amount */}
              <div className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
                <div>
                  <p className="text-xs text-muted-foreground">مبلغ قابل پرداخت</p>
                  <p className="text-lg font-bold">
                    {formatNumber(order.totalAmount)} تومان
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() =>
                    copyToClipboard(
                      order.totalAmount.toString(),
                      "مبلغ",
                    )
                  }
                >
                  <Copy className="size-4" />
                </Button>
              </div>

              {/* Card Number */}
              <div className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
                <div>
                  <p className="text-xs text-muted-foreground">شماره کارت</p>
                  <p className="font-mono text-lg font-bold" dir="ltr">
                    {formatCardNumber(cardDetails.number)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() =>
                    copyToClipboard(cardDetails.number, "شماره کارت")
                  }
                >
                  <Copy className="size-4" />
                </Button>
              </div>

              {/* Holder Name */}
              {cardDetails.holderName && (
                <div className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
                  <div>
                    <p className="text-xs text-muted-foreground">نام صاحب کارت</p>
                    <p className="font-medium">{cardDetails.holderName}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() =>
                      copyToClipboard(cardDetails.holderName, "نام صاحب کارت")
                    }
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
            لطفاً مبلغ دقیق را واریز کنید و رسید پرداخت را ذخیره کنید. پس از
            واریز، روی «مرحله بعد» کلیک کنید.
          </div>

          <Button
            onClick={() => setStep("upload")}
            className="h-12 w-full text-base font-semibold"
            size="lg"
          >
            مرحله بعد
            <ArrowLeft className="size-5" />
          </Button>
        </div>
      )}

      {/* Step 2: Upload Receipt */}
      {step === "upload" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl border border-border bg-background">
                <Upload className="size-5 text-foreground/80" />
              </span>
              <div>
                <p className="font-medium">ارسال رسید پرداخت</p>
                <p className="text-sm text-muted-foreground">
                  تصویر رسید واریز را آپلود کنید
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="receipt" className="cursor-pointer">
                  <div
                    className={cn(
                      "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 transition-colors",
                      receipt
                        ? "border-primary bg-primary/5"
                        : "border-border/60 hover:border-border",
                    )}
                  >
                    {receiptPreview ? (
                      <img
                        src={receiptPreview}
                        alt="رسید پرداخت"
                        className="max-h-48 rounded-lg object-contain"
                      />
                    ) : (
                      <>
                        <Upload className="mb-2 size-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          کلیک کنید یا تصویر را بکشید
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          PNG, JPG تا ۵ مگابایت
                        </p>
                      </>
                    )}
                  </div>
                </Label>
                <Input
                  id="receipt"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleReceiptChange}
                />
              </div>

              {receipt && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setReceipt(null);
                    setReceiptPreview(null);
                  }}
                >
                  حذف تصویر
                </Button>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep("details")}
              className="h-12 flex-1"
            >
              <ArrowRight className="size-5" />
              مرحله قبل
            </Button>
            <Button
              onClick={handleSubmitReceipt}
              className="h-12 flex-1 text-base font-semibold"
              disabled={!receipt || submitting}
            >
              {submitting ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <>
                  ثبت و تأیید
                  <CheckCircle className="size-5" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Success */}
      {step === "success" && (
        <div className="space-y-4 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle className="size-8 text-green-500" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold">رسید شما ثبت شد</h2>
            <p className="text-muted-foreground">
              پرداخت شما در انتظار تأیید است. تیم ما رسید را بررسی کرده و
              سفارش شما را تأیید می‌کند.
            </p>
            <p className="text-sm text-muted-foreground">
              زمان تأیید معمولاً تا ۲۴ ساعت کاری است.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">
              شماره سفارش: <span className="font-mono font-bold">{orderId}</span>
            </p>
          </div>

          <Button
            onClick={() => router.push("/")}
            className="h-12 w-full text-base font-semibold"
            size="lg"
          >
            بازگشت به صفحه اصلی
            <ArrowLeft className="size-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
