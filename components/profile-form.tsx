"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { authClient } from "@/lib/auth-client";
import { Textarea } from "./ui/textarea";
import { z } from "zod";

interface ProfileFormProps {
  profile: any;
}

// Schema تعریف شده با Zod (همان فرم چک‌اوت)
const profileSchema = z.object({
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
    .length(10, "کد پستی باید ۱۰ رقمی باشد")
    .regex(/^\d+$/, "کد پستی باید فقط شامل اعداد باشد"),

  telegram: z.string().min(5, "یوزرنیم باید حداقل 5 کاراکتر باشه").optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileForm({ profile }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof ProfileFormData, string>>
  >({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof ProfileFormData, boolean>>
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

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const validateForm = async () => {
      try {
        profileSchema.parse({
          ...formData,
          phoneNumber: formData.phoneNumber.replace(/\s/g, ""),
        });
        setIsFormValid(true);
      } catch (error) {
        setIsFormValid(false);
      }
    };

    validateForm();
  }, [formData]);

  const validateField = (field: keyof ProfileFormData, value: string) => {
    try {
      if (field === "phoneNumber") {
        const cleanedValue = value.replace(/\s/g, "");
        profileSchema.pick({ [field]: true }).parse({ [field]: cleanedValue });
      } else {
        profileSchema.pick({ [field]: true }).parse({ [field]: value });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      toast({
        title: "خطا در فرم",
        description: "لطفاً تمام فیلدها را به درستی پر کنید",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const validatedData = profileSchema.parse({
        ...formData,
        phoneNumber: formData.phoneNumber.replace(/\s/g, ""),
      });

      const { data: session } = await authClient.getSession();

      if (!session?.user) throw new Error("User not authenticated");

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: validatedData.displayName,
          phone_number: validatedData.phoneNumber,
          address: validatedData.address,
          city: validatedData.city,
          postal_code: validatedData.postalCode,
          telegram: validatedData.telegram,
        }),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      toast({
        title: "اطلاعات شما با موفقیت ذخیره شد",
      });

      router.push("/dashboard");
    } catch (error) {
      console.error("Profile update error:", error);

      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof ProfileFormData, string>> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof ProfileFormData] = err.message;
          }
        });
        setErrors(fieldErrors);

        toast({
          title: "خطا در فرم",
          description: "لطفاً اطلاعات فرم را بررسی کنید",
          variant: "destructive",
        });
      } else {
        toast({
          title: "مشکلی در به‌روزرسانی اطلاعات پیش آمد",
          description:
            error instanceof Error ? error.message : "لطفاً دوباره تلاش کنید",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    const limited = numbers.slice(0, 11);

    if (limited.length <= 4) {
      return limited;
    } else if (limited.length <= 7) {
      return `${limited.slice(0, 4)} ${limited.slice(4)}`;
    } else {
      return `${limited.slice(0, 4)} ${limited.slice(4, 7)} ${limited.slice(
        7
      )}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, phoneNumber: formatted });
    validateField("phoneNumber", formatted);
  };

  const handleFieldChange =
    (field: keyof ProfileFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setFormData((prev) => ({ ...prev, [field]: value }));

      // اعتبارسنجی بلادرنگ فقط اگر فیلد قبلاً لمس شده
      if (touched[field]) {
        validateField(field, value);
      }
    };

  const handleFieldBlur =
    (field: keyof ProfileFormData) =>
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      validateField(field, e.target.value);
    };

  // بررسی اینکه آیا همه فیلدها پر شده‌اند
  const isFormComplete = Object.values(formData).every(
    (value) => value.trim().length > 0
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border bg-card p-6 shadow-sm space-y-6"
    >
      <h2 className="text-lg font-semibold text-center mb-2">ویرایش پروفایل</h2>
      <p className="text-center text-sm text-muted-foreground mb-4">
        لطفاً اطلاعات خود را بررسی و در صورت نیاز ویرایش کنید.
      </p>

      <div className="grid gap-3">
        <Label htmlFor="displayName">نام و نام خانوادگی</Label>
        <Input
          id="displayName"
          className={`bg-background! rounded-xl border-muted focus:ring-2 focus:ring-primary/30 ${
            errors.displayName ? "border-destructive" : ""
          }`}
          placeholder="نام کامل"
          value={formData.displayName}
          onChange={handleFieldChange("displayName")}
          onBlur={handleFieldBlur("displayName")}
        />
        {errors.displayName && (
          <p className="text-sm text-destructive mt-1">{errors.displayName}</p>
        )}
      </div>

      <div className="grid gap-3">
        <Label htmlFor="phoneNumber">شماره تماس</Label>
        <p className="text-sm text-muted-foreground">
          این شماره تماس باید در دسترس باشه تا درصورت لزوم مامور پست بتونه تماس
          بگیره
        </p>
        <Input
          id="phoneNumber"
          type="tel"
          className={`bg-background! rounded-xl border-muted focus:ring-2 focus:ring-primary/30 ${
            errors.phoneNumber ? "border-destructive" : ""
          }`}
          placeholder="0912 345 6789"
          maxLength={13}
          value={formData.phoneNumber}
          onChange={handlePhoneChange}
          onBlur={handleFieldBlur("phoneNumber")}
        />
        {errors.phoneNumber && (
          <p className="text-sm text-destructive mt-1">{errors.phoneNumber}</p>
        )}
      </div>

      <div className="grid gap-3">
        <Label htmlFor="city">شهر</Label>
        <Input
          id="city"
          className={`bg-background! rounded-xl border-muted focus:ring-2 focus:ring-primary/30 ${
            errors.city ? "border-destructive" : ""
          }`}
          placeholder="شهر"
          value={formData.city}
          onChange={handleFieldChange("city")}
          onBlur={handleFieldBlur("city")}
        />
        {errors.city && (
          <p className="text-sm text-destructive mt-1">{errors.city}</p>
        )}
      </div>

      <div className="grid gap-3">
        <Label htmlFor="address">آدرس</Label>
        <Textarea
          id="address"
          className={`bg-background! min-h-25 rounded-xl border-muted focus:ring-2 focus:ring-primary/30 resize-none ${
            errors.address ? "border-destructive" : ""
          }`}
          placeholder="آدرس دقیق با تمام جزئیات شامل محله، خیابان، کوچه، پلاک، شماره واحد یا زنگ"
          value={formData.address}
          onChange={handleFieldChange("address")}
          onBlur={handleFieldBlur("address")}
        />
        {errors.address && (
          <p className="text-sm text-destructive mt-1">{errors.address}</p>
        )}
      </div>

      <div className="grid gap-3">
        <Label htmlFor="postalCode">کد پستی</Label>
        <p className="text-sm text-muted-foreground">
          اگه کد پستی رو پیدا نکردی، نزدیک ترین کد پستی به این آدرس رو وارد کن
          مثل یه مغازه نزدیک
        </p>
        <Input
          dir="ltr"
          id="postalCode"
          className={`bg-background! rounded-xl border-muted focus:ring-2 focus:ring-primary/30 ${
            errors.postalCode ? "border-destructive" : ""
          }`}
          placeholder="1234567890"
          maxLength={10}
          value={formData.postalCode}
          onChange={(e) => {
            const numbers = e.target.value.replace(/\D/g, "");
            const limited = numbers.slice(0, 10);
            setFormData({ ...formData, postalCode: limited });
            if (touched.postalCode) {
              validateField("postalCode", limited);
            }
          }}
          onBlur={handleFieldBlur("postalCode")}
        />
        {errors.postalCode && (
          <p className="text-sm text-destructive mt-1">{errors.postalCode}</p>
        )}
      </div>

      <div className="grid gap-3">
        <Label htmlFor="telegram">آیدی تلگرام</Label>
        <p className="text-sm text-muted-foreground">
          درصورت بوجود اومدن مشکلی برای سفارشت، اول با این آیدی ارتباط میگیریم
        </p>
        <div dir="ltr" className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            @
          </span>
          <Input
            dir="ltr"
            id="telegram"
            className={`bg-background! pl-7 rounded-xl border-muted focus:ring-2 focus:ring-primary/30 ${
              errors.telegram ? "border-destructive" : ""
            }`}
            placeholder="collectina :مثال"
            value={formData.telegram.replace(/^@/, "")}
            onChange={handleFieldChange("telegram")}
            onBlur={handleFieldBlur("telegram")}
          />
        </div>
        {errors.telegram && (
          <p className="text-sm text-destructive mt-1">{errors.telegram}</p>
        )}
      </div>
      <Button
        type="submit"
        className="w-full rounded-xl text-base font-medium transition-all duration-200 hover:opacity-90"
        disabled={isLoading || !isFormValid || !isFormComplete}
      >
        {isLoading ? "در حال ذخیره..." : "ذخیره تغییرات"}
      </Button>
      <p className="text-sm text-muted-foreground text-center">
        درصورتی که اطلاعات رو اشتباه وارد کنید،
        <br />
        مسئولیت گم شدن سفارش یا هزینه ارسال مجددش با خودتونه:(
      </p>
    </form>
  );
}
