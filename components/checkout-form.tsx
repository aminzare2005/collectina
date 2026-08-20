"use client";

import type React from "react";
import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "./ui/textarea";
import { z } from "zod";
import {
  ArrowLeft,
  ImageIcon,
  Loader2,
  Smartphone,
  Tag,
  Truck,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { Profile } from "@/lib/types/database";
import { cn } from "@/lib/utils";
import type { ShippableProductType } from "@/lib/shipping";

export type CheckoutFormControls = {
  /** اعتبارسنجی؛ در صورت خطا اسکرول به اولین فیلد، وگرنه باز کردن تأیید پرداخت */
  requestPayment: () => void;
};

export type CheckoutFormUiState = {
  canSubmit: boolean;
  isLoading: boolean;
  payAmount: number;
};

interface CheckoutFormProps {
  profile: Profile | null;
  total: number;
  productTypes?: ShippableProductType[];
  onDiscountChange: (
    discount: {
      discountAmount: number;
      freeShipping: boolean;
    } | null,
  ) => void;
  controlsRef?: RefObject<CheckoutFormControls | null>;
  onUiStateChange?: (state: CheckoutFormUiState) => void;
}

interface AppliedDiscount {
  discountId: string;
  discountAmount: number;
  freeShipping: boolean;
}

const checkoutSchema = z.object({
  displayName: z
    .string()
    .min(2, "نام باید حداقل ۲ کاراکتر باشد")
    .regex(/^[\u0600-\u06FF\s]+$/, "لطفاً فقط از حروف فارسی استفاده کنید"),

  phoneNumber: z
    .string()
    .min(1, "شماره تماس الزامی است")
    .transform((val) => val.replace(/\s/g, ""))
    .refine((val) => /^09\d{9}$/.test(val), {
      message: "شماره تماس باید با 09 شروع شود و 11 رقم باشد",
    }),

  city: z
    .string()
    .min(2, "نام شهر باید حداقل ۲ کاراکتر باشد")
    .regex(/^[\u0600-\u06FF\s]+$/, "لطفاً فقط از حروف فارسی استفاده کنید"),

  address: z.string().min(10, "آدرس باید حداقل ۱۰ کاراکتر باشد"),

  postalCode: z
    .string()
    .length(10, "کد پستی باید دقیقاً ۱۰ رقم باشد")
    .regex(/^\d+$/, "کد پستی باید فقط شامل اعداد باشد"),

  telegram: z
    .string()
    .refine((val) => val.trim() === "" || val.trim().length >= 3, {
      message: "یوزرنیم باید حداقل ۳ کاراکتر باشه",
    }),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

const REQUIRED_FIELDS: (keyof CheckoutFormData)[] = [
  "displayName",
  "phoneNumber",
  "city",
  "address",
  "postalCode",
];

const FIELD_ORDER: (keyof CheckoutFormData)[] = [
  "displayName",
  "phoneNumber",
  "city",
  "address",
  "postalCode",
  "telegram",
];

const formatPhoneNumber = (value: string): string => {
  const numbers = value.replace(/\D/g, "");
  const limited = numbers.slice(0, 11);

  if (limited.length <= 4) return limited;
  if (limited.length <= 7) return `${limited.slice(0, 4)} ${limited.slice(4)}`;
  return `${limited.slice(0, 4)} ${limited.slice(4, 7)} ${limited.slice(7)}`;
};

const formatNumber = (n: number): string =>
  new Intl.NumberFormat("fa-IR").format(n);

function parseCheckoutForm(formData: {
  displayName: string;
  phoneNumber: string;
  city: string;
  address: string;
  postalCode: string;
  telegram: string;
}) {
  return checkoutSchema.parse({
    ...formData,
    phoneNumber: formData.phoneNumber.replace(/\s/g, ""),
    telegram: formData.telegram.trim(),
  });
}

export function CheckoutForm({
  profile,
  total,
  productTypes = [],
  onDiscountChange,
  controlsRef,
  onUiStateChange,
}: CheckoutFormProps) {
  const { toast } = useToast();
  const formId = useId();

  const hasPoster = productTypes.includes("poster");
  const hasPhonecase = productTypes.includes("phonecase");
  const shipsInTwoPackages = hasPoster && hasPhonecase;

  const [isLoading, setIsLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof CheckoutFormData, string>>
  >({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof CheckoutFormData, boolean>>
  >({});
  const [isFormValid, setIsFormValid] = useState(false);

  const [formData, setFormData] = useState({
    displayName: profile?.display_name || "",
    phoneNumber: profile?.phone_number || "",
    address: profile?.address || "",
    city: profile?.city || "",
    postalCode: profile?.postal_code || "",
    telegram: profile?.telegram || "",
  });

  const [discountCode, setDiscountCode] = useState("");
  const [discountLoading, setDiscountLoading] = useState(false);
  const [appliedDiscount, setAppliedDiscount] =
    useState<AppliedDiscount | null>(null);

  const finalTotal = Math.max(
    total - (appliedDiscount?.discountAmount || 0),
    0,
  );

  const isFormComplete = REQUIRED_FIELDS.every(
    (field) => formData[field].trim().length > 0,
  );

  const canSubmit = isFormValid && isFormComplete && !isLoading;

  useEffect(() => {
    if (!profile) return;
    setFormData((prev) => ({
      displayName: prev.displayName || profile.display_name || "",
      phoneNumber: prev.phoneNumber || profile.phone_number || "",
      address: prev.address || profile.address || "",
      city: prev.city || profile.city || "",
      postalCode: prev.postalCode || profile.postal_code || "",
      telegram: prev.telegram || profile.telegram || "",
    }));
  }, [profile]);

  useEffect(() => {
    try {
      parseCheckoutForm(formData);
      setIsFormValid(true);
    } catch {
      setIsFormValid(false);
    }
  }, [formData]);

  useEffect(() => {
    onUiStateChange?.({
      canSubmit,
      isLoading,
      payAmount: finalTotal,
    });
  }, [canSubmit, isLoading, finalTotal, onUiStateChange]);

  const validateField = (
    field: keyof CheckoutFormData,
    value: string,
  ): boolean => {
    try {
      if (field === "phoneNumber") {
        checkoutSchema.shape.phoneNumber.parse(value.replace(/\s/g, ""));
      } else if (field === "telegram") {
        checkoutSchema.shape.telegram.parse(value);
      } else {
        checkoutSchema.shape[field].parse(value);
      }
      setErrors((prev) => ({ ...prev, [field]: undefined }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors((prev) => ({
          ...prev,
          [field]: error.issues[0]?.message,
        }));
      }
      return false;
    }
  };

  const validateAllAndCollectErrors = () => {
    try {
      parseCheckoutForm(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof CheckoutFormData, string>> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof CheckoutFormData] = err.message;
          }
        });
        setErrors(fieldErrors);
        setTouched(
          FIELD_ORDER.reduce(
            (acc, key) => {
              acc[key] = true;
              return acc;
            },
            {} as Partial<Record<keyof CheckoutFormData, boolean>>,
          ),
        );
        const firstKey = FIELD_ORDER.find((key) => fieldErrors[key]);
        if (firstKey) {
          document
            .getElementById(`${formId}-${firstKey}`)
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
          document.getElementById(`${formId}-${firstKey}`)?.focus();
        }
      }
      return false;
    }
  };

  const requestPaymentRef = useRef(() => {});
  requestPaymentRef.current = () => {
    if (!validateAllAndCollectErrors()) {
      toast({
        title: "اطلاعات ناقصه",
        description: "لطفاً فیلدهای مشخص‌شده رو درست پر کن",
        variant: "destructive",
      });
      return;
    }
    setConfirmOpen(true);
  };

  useEffect(() => {
    if (!controlsRef) return;
    controlsRef.current = {
      requestPayment: () => requestPaymentRef.current(),
    };
    return () => {
      controlsRef.current = null;
    };
  }, [controlsRef]);

  const applyDiscountCode = async () => {
    if (!discountCode.trim()) return;

    setDiscountLoading(true);

    try {
      const response = await fetch("/api/discount/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: discountCode.trim(), total }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: data.error || "کد تخفیف معتبر نیست",
          variant: "destructive",
        });
        return;
      }

      const newDiscount: AppliedDiscount = {
        discountId: data.discountId,
        discountAmount: data.discountAmount,
        freeShipping: data.freeShipping,
      };

      setAppliedDiscount(newDiscount);
      onDiscountChange({ discountAmount: data.discountAmount, freeShipping: data.freeShipping });

      toast({
        title: "کد تخفیف اعمال شد",
        description: "تخفیف با موفقیت روی سفارش اعمال شد",
      });
    } catch (err) {
      console.error("Discount error:", err);
      setAppliedDiscount(null);
      onDiscountChange(null);
      toast({
        title: "خطا در اعمال کد تخفیف",
        variant: "destructive",
      });
    } finally {
      setDiscountLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateAllAndCollectErrors()) return;

    setIsLoading(true);
    setConfirmOpen(false);

    try {
      const validatedData = parseCheckoutForm(formData);

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: validatedData.displayName,
          phoneNumber: validatedData.phoneNumber,
          address: validatedData.address,
          city: validatedData.city,
          postalCode: validatedData.postalCode,
          telegram: validatedData.telegram || "",
          discountCode: appliedDiscount ? discountCode : undefined,
          total,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "مشکلی در ثبت سفارش پیش آمد");
      }

      if (data.success && data.paymentStartUrl) {
        window.location.href = data.paymentStartUrl;
      } else {
        throw new Error("خطا در ایجاد درگاه پرداخت");
      }
    } catch (error) {
      console.error("Checkout error:", error);

      if (error instanceof z.ZodError) {
        toast({
          title: "خطا در فرم",
          description: "لطفاً اطلاعات فرم را بررسی کنید",
          variant: "destructive",
        });
      } else {
        toast({
          title: "خطا",
          description:
            error instanceof Error
              ? error.message
              : "مشکلی در ثبت سفارش پیش آمد. لطفاً دوباره تلاش کنید.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, phoneNumber: formatted });
    if (touched.phoneNumber) {
      validateField("phoneNumber", formatted);
    }
  };

  const handleFieldChange =
    (field: keyof CheckoutFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setFormData((prev) => ({ ...prev, [field]: value }));

      if (touched[field]) {
        validateField(field, value);
      }
    };

  const handleFieldBlur =
    (field: keyof CheckoutFormData) =>
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      validateField(field, e.target.value);
    };

  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numbers = e.target.value.replace(/\D/g, "");
    const limited = numbers.slice(0, 10);
    setFormData({ ...formData, postalCode: limited });
    if (touched.postalCode) {
      validateField("postalCode", limited);
    }
  };

  const handleDiscountCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const englishOnly = value.replace(/[^a-zA-Z0-9]/g, "");
    setDiscountCode(englishOnly.toUpperCase());
  };

  const handleTelegramChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/^@/, "");
    setFormData({ ...formData, telegram: value });
    if (touched.telegram) {
      validateField("telegram", value);
    }
  };

  return (
    <>
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          requestPaymentRef.current();
        }}
      >
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-foreground">
            مشخصات گیرنده
          </legend>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor={`${formId}-displayName`}>
                نام و نام خانوادگی
              </Label>
              <Input
                id={`${formId}-displayName`}
                required
                autoComplete="name"
                dir="auto"
                value={formData.displayName}
                onChange={handleFieldChange("displayName")}
                onBlur={handleFieldBlur("displayName")}
                className={cn(
                  "h-11",
                  errors.displayName && "border-destructive",
                )}
              />
              {errors.displayName && (
                <p className="text-sm text-destructive">{errors.displayName}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`${formId}-phoneNumber`}>شماره تماس</Label>
              <Input
                id={`${formId}-phoneNumber`}
                type="tel"
                inputMode="tel"
                required
                autoComplete="tel"
                dir="ltr"
                placeholder="0912 345 6789"
                maxLength={13}
                value={formData.phoneNumber}
                onChange={handlePhoneChange}
                onBlur={handleFieldBlur("phoneNumber")}
                className={cn(
                  "h-11",
                  errors.phoneNumber && "border-destructive",
                )}
              />
              <p className="text-xs text-muted-foreground">
                شماره‌ای که مامور ارسال در صورت نیاز باهاش تماس می‌گیره
              </p>
              {errors.phoneNumber && (
                <p className="text-sm text-destructive">{errors.phoneNumber}</p>
              )}
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              <div className="grid gap-2">
                <Label htmlFor={`${formId}-city`}>شهر</Label>
                <Input
                  id={`${formId}-city`}
                  required
                  autoComplete="address-level2"
                  dir="auto"
                  value={formData.city}
                  onChange={handleFieldChange("city")}
                  onBlur={handleFieldBlur("city")}
                  className={cn("h-11", errors.city && "border-destructive")}
                />
                {errors.city && (
                  <p className="text-sm text-destructive">{errors.city}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`${formId}-postalCode`}>کد پستی</Label>
                <Input
                  id={`${formId}-postalCode`}
                  required
                  inputMode="numeric"
                  autoComplete="postal-code"
                  dir="ltr"
                  placeholder="1234567890"
                  maxLength={10}
                  value={formData.postalCode}
                  onChange={handlePostalCodeChange}
                  onBlur={handleFieldBlur("postalCode")}
                  className={cn(
                    "h-11",
                    errors.postalCode && "border-destructive",
                  )}
                />
                {errors.postalCode && (
                  <p className="text-sm text-destructive">
                    {errors.postalCode}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`${formId}-address`}>آدرس کامل</Label>
              <Textarea
                id={`${formId}-address`}
                required
                autoComplete="street-address"
                dir="auto"
                className={cn(
                  "min-h-[96px] resize-none",
                  errors.address && "border-destructive",
                )}
                value={formData.address}
                onChange={handleFieldChange("address")}
                onBlur={handleFieldBlur("address")}
              />
              <p className="text-xs text-muted-foreground">
                اگه کد پستی نداری، نزدیک ترین کد پستی به این آدرس رو وارد کن مثل
                یه مغازه نزدیک یا همسایه
              </p>
              {errors.address && (
                <p className="text-sm text-destructive">{errors.address}</p>
              )}
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-foreground">
            تلگرام{" "}
            <span className="font-normal text-muted-foreground">(اختیاری)</span>
          </legend>
          <div className="grid gap-2">
            <div className="relative" dir="ltr">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                @
              </span>
              <Input
                id={`${formId}-telegram`}
                dir="ltr"
                autoComplete="username"
                placeholder="username"
                value={formData.telegram}
                onChange={handleTelegramChange}
                onBlur={handleFieldBlur("telegram")}
                className={cn(
                  "h-11 pl-7",
                  errors.telegram && "border-destructive",
                )}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              درصورت بوجود اومدن مشکلی برای سفارشت، با این آیدی ارتباط میگیریم
            </p>
            {errors.telegram && (
              <p className="text-sm text-destructive">{errors.telegram}</p>
            )}
          </div>
        </fieldset>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3.5 py-3 text-xs leading-relaxed text-muted-foreground">
          اگه اطلاعات رو اشتباه وارد کنی ممکنه بسته با تاخیر به دستت
          برسه یا لازم باشه دوباره هزینه ارسال رو واریز کنی🫶🏻
        </div>

        <div className="hidden">
          <Button
            type="submit"
            className="h-12 w-full text-base font-semibold"
            size="lg"
            disabled={!canSubmit}
          >
            {isLoading ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                در حال پردازش...
              </>
            ) : (
              <>
                پرداخت {formatNumber(finalTotal)} تومان
                <ArrowLeft className="size-5" />
              </>
            )}
          </Button>
          {!canSubmit && (
            <p className="text-center text-xs text-muted-foreground">
              برای پرداخت، همه فیلدهای اجباری رو کامل کن
            </p>
          )}
        </div>

        <Accordion type="single" collapsible className="rounded-xl border px-1">
          <AccordionItem value="discount" className="border-0">
            <AccordionTrigger className="px-3 py-3 text-sm font-medium hover:no-underline">
              <span className="inline-flex items-center gap-2">
                <Tag className="size-4 text-muted-foreground" />
                کد تخفیف دارم
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3">
              <div className="flex items-center justify-center flex-col-reverse gap-2 sm:flex-row">
                <Button
                  className="h-11 w-full sm:w-auto"
                  type="button"
                  variant="secondary"
                  onClick={applyDiscountCode}
                  disabled={discountLoading || !!appliedDiscount}
                >
                  {discountLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "اعمال"
                  )}
                </Button>
                <Input
                  dir="ltr"
                  placeholder="WELCOME"
                  value={discountCode}
                  className="h-11 uppercase"
                  onChange={handleDiscountCodeChange}
                  disabled={discountLoading || !!appliedDiscount}
                />
              </div>
              {appliedDiscount && (
                <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                  {appliedDiscount.freeShipping
                    ? "ارسال رایگان اعمال شد"
                    : "تخفیف اعمال شد"}
                </p>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </form>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent dir="rtl" className="max-w-md gap-5">
          <AlertDialogHeader className="gap-4 text-right sm:text-right">
            <AlertDialogTitle className="text-right text-lg">
              پرداخت {formatNumber(finalTotal)} تومان؟
            </AlertDialogTitle>
            <AlertDialogDescription className="sr-only">
              مبلغ قابل پرداخت {formatNumber(finalTotal)} تومان.
              {shipsInTwoPackages
                ? " سفارش در ۲ مرسوله جدا ارسال می‌شود."
                : ""}{" "}
              {[
                hasPoster && "آماده‌سازی پوستر تا ۲ روز",
                hasPhonecase && "آماده‌سازی قاب موبایل ۵ تا ۱۰ روز",
                shipsInTwoPackages
                  ? "ارسال در ۲ بسته جدا، هر بسته بین ۳ تا ۷ روز بعد از ارسال"
                  : "ارسال پستی بین ۳ تا ۷ روز بعد از ارسال",
              ]
                .filter(Boolean)
                .join("؛ ")}
              . وضعیت سفارش از سایت قابل پیگیری است.
            </AlertDialogDescription>

            <ul className="grid gap-2">
              {hasPoster && (
                <li className="flex items-center gap-3 rounded-xl border border-border/60 px-3 py-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background">
                    <ImageIcon
                      className="size-4 text-foreground/80"
                      aria-hidden
                    />
                  </span>
                  <div className="min-w-0 flex-1 text-start">
                    <p className="text-sm font-medium text-foreground">پوستر</p>
                    <p className="text-xs text-muted-foreground">
                      آماده‌سازی تا ۲ روز
                    </p>
                  </div>
                </li>
              )}
              {hasPhonecase && (
                <li className="flex items-center gap-3 rounded-xl border border-border/60 px-3 py-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background">
                    <Smartphone
                      className="size-4 text-foreground/80"
                      aria-hidden
                    />
                  </span>
                  <div className="min-w-0 flex-1 text-start">
                    <p className="text-sm font-medium text-foreground">
                      قاب موبایل
                    </p>
                    <p className="text-xs text-muted-foreground">
                      آماده‌سازی ۵ تا ۱۰ روز
                    </p>
                  </div>
                </li>
              )}
              <li className="flex items-center gap-3 rounded-xl border border-border/60 px-3 py-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background">
                  <Truck className="size-4 text-foreground/80" aria-hidden />
                </span>
                <div className="min-w-0 flex-1 text-start">
                  {shipsInTwoPackages ? (
                    <>
                      <p className="text-sm font-medium text-foreground">
                        ارسال در ۲ بسته جدا
                      </p>
                      <p className="text-xs text-muted-foreground">
                        هر بسته بین ۳ تا ۷ روز بعد از ارسال
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-foreground">
                        ارسال پستی
                      </p>
                      <p className="text-xs text-muted-foreground">
                        بین ۳ تا ۷ روز بعد از ارسال
                      </p>
                    </>
                  )}
                </div>
              </li>
            </ul>

            <p className="text-center text-xs text-muted-foreground">
              وضعیت سفارش رو از سایت می‌تونی پیگیری کنی
            </p>
          </AlertDialogHeader>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <AlertDialogCancel className="sm:mt-0">انصراف</AlertDialogCancel>
            <Button
              type="button"
              onClick={handleSubmit}
              className="gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  در حال اتصال به درگاه...
                </>
              ) : (
                <>
                  تأیید و پرداخت
                  <ArrowLeft className="size-4" />
                </>
              )}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
