"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ShouldIRenderType } from "@/helpers/should-i-render";
import { ToastAction } from "@/components/ui/toast";
import { ProductPurchaseDock } from "@/components/product/product-purchase-dock";
import { ProductUnavailableNotice } from "@/components/product/product-unavailable-notice";

type PhoneCase = {
  id: string;
  brand: string;
  model: string;
  price: number;
  available: boolean;
  created_at: string;
};

type PhoneCaseSelectorProps = {
  productId: string;
  phoneCases: PhoneCase[];
  shouldIRender: ShouldIRenderType;
};

const formatPrice = (n: number) => new Intl.NumberFormat("fa-IR").format(n);

export function PhoneCaseSelector({
  productId,
  phoneCases,
  shouldIRender,
}: PhoneCaseSelectorProps) {
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [selectedPhoneCaseId, setSelectedPhoneCaseId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { toast } = useToast();
  const isPhoneCaseEnabled = shouldIRender.show_phonecase;

  const groupedPhoneCases = phoneCases.reduce(
    (acc, phoneCase) => {
      if (!acc[phoneCase.brand]) acc[phoneCase.brand] = [];
      acc[phoneCase.brand].push(phoneCase);
      return acc;
    },
    {} as Record<string, PhoneCase[]>,
  );

  const brands = Object.keys(groupedPhoneCases).sort();
  const brandPhoneCases = selectedBrand
    ? groupedPhoneCases[selectedBrand] || []
    : [];
  const selectedPhoneCase = phoneCases.find(
    (pc) => pc.id === selectedPhoneCaseId,
  );

  useEffect(() => {
    const savedBrand = localStorage.getItem("selectedBrand");
    const savedModelId = localStorage.getItem("selectedPhoneCaseId");

    if (savedBrand && groupedPhoneCases[savedBrand]) {
      setSelectedBrand(savedBrand);
      const stillExists = groupedPhoneCases[savedBrand].some(
        (pc) => pc.id === savedModelId,
      );
      if (savedModelId && stillExists) {
        setSelectedPhoneCaseId(savedModelId);
      }
    }
  }, [phoneCases]);

  useEffect(() => {
    if (selectedBrand) localStorage.setItem("selectedBrand", selectedBrand);
  }, [selectedBrand]);

  useEffect(() => {
    if (selectedPhoneCaseId)
      localStorage.setItem("selectedPhoneCaseId", selectedPhoneCaseId);
  }, [selectedPhoneCaseId]);

  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
    setSelectedPhoneCaseId("");
  };

  const handleAddToCart = async () => {
    if (!selectedBrand || !selectedPhoneCaseId) {
      toast({
        title: "خطا",
        description: "لطفا برند و مدل گوشی خود را انتخاب کنید",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: session } = await authClient.getSession();
      if (!session?.user) {
        localStorage.setItem("backTo", `/phonecase/${productId}`);
        router.push(`/auth/login`);
        return;
      }

      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, phoneCaseId: selectedPhoneCaseId }),
      });
      if (!res.ok) throw new Error("Failed to add to cart");

      toast({
        title: "به سبد اضافه شد",
        description: "می‌تونی خریدت رو ادامه بدی یا بری سبد خرید",
        action: (
          <ToastAction
            altText="مشاهده سبد"
            onClick={() => router.push("/cart")}
          >
            مشاهده سبد
          </ToastAction>
        ),
      });
      window.dispatchEvent(new Event("cart-updated"));
      router.refresh();
    } catch (error) {
      toast({
        title: "خطا",
        description: "مشکلی در افزودن به سبد خرید پیش آمد",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isPhoneCaseEnabled) {
    return (
      <ProductUnavailableNotice
        title="فعلا قاب نداریم :("
        description="درحال حاضر نمیتونیم قاب گوشی تولید کنیم. اگه دوباره موجود بشه تو کانال تلگرام اطلاع میدیم."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="brand-select" className="text-sm">
            برند گوشی
          </Label>
          <Select value={selectedBrand} onValueChange={handleBrandChange}>
            <SelectTrigger id="brand-select" className="h-12 bg-background/70">
              <SelectValue placeholder="برند گوشیت رو انتخاب کن" />
            </SelectTrigger>
            <SelectContent>
              {brands.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="model-select" className="text-sm">
            مدل گوشی
          </Label>
          <Select
            disabled={!selectedBrand}
            value={selectedPhoneCaseId}
            onValueChange={setSelectedPhoneCaseId}
          >
            <SelectTrigger id="model-select" className="h-12 bg-background/70">
              <SelectValue placeholder="مدل گوشیت رو انتخاب کن" />
            </SelectTrigger>
            <SelectContent>
              {brandPhoneCases.map((phoneCase) => (
                <SelectItem
                  key={phoneCase.id}
                  value={phoneCase.id}
                  disabled={!phoneCase.available}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className={cn(!phoneCase.available && "opacity-80")}>
                      {phoneCase.model}
                    </span>
                    {!phoneCase.available && (
                      <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-500">
                        ناموجود
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ProductPurchaseDock
        priceHint={`قیمت برای ${selectedPhoneCase?.model || "مدل انتخابی"}`}
        priceDisplay={
          selectedPhoneCase ? (
            <span className="inline-flex items-baseline gap-1">
              {formatPrice(selectedPhoneCase.price)}
              <span className="text-base font-bold opacity-70">تومان</span>
            </span>
          ) : (
            <span className="text-sm font-normal text-muted-foreground">
              برند و مدل رو انتخاب کن
            </span>
          )
        }
        onSubmit={handleAddToCart}
        isLoading={isLoading}
        canSubmit={Boolean(selectedPhoneCaseId)}
      />
    </div>
  );
}
