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

type Posters = {
  id: string;
  attribute: string | null;
  price: string;
  available: boolean;
};

type PosterSelectorProps = {
  productId: string;
  posters: Posters[];
  shouldIRender: ShouldIRenderType;
};

const formatPrice = (n: number) => new Intl.NumberFormat("fa-IR").format(n);

export function PosterSelector({
  productId,
  posters,
  shouldIRender,
}: PosterSelectorProps) {
  const [selectedPosterId, setSelectedPosterId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { toast } = useToast();
  const isPosterEnabled = shouldIRender.show_poster;

  const selectedPoster = posters.find(
    (poster) => poster.id === selectedPosterId,
  );

  useEffect(() => {
    if (!posters.length) return;
    const savedPosterId = localStorage.getItem("selectedPosterId");
    if (!savedPosterId) return;
    const stillExists = posters.some((poster) => poster.id === savedPosterId);
    if (stillExists) {
      setSelectedPosterId(savedPosterId);
    }
  }, [posters]);

  useEffect(() => {
    if (selectedPosterId) {
      localStorage.setItem("selectedPosterId", selectedPosterId);
    }
  }, [selectedPosterId]);

  const handleAddToCart = async () => {
    if (!selectedPosterId) {
      toast({
        title: "خطا",
        description: "لطفا سایز پوستر رو انتخاب کن",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: session } = await authClient.getSession();

      if (!session?.user) {
        localStorage.setItem("backTo", `/poster/${productId}`);
        router.push(`/auth/login`);
        return;
      }

      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, posterId: selectedPosterId }),
      });
      if (!res.ok) throw new Error("Failed to add to cart");

      toast({
        title: "به سبد اضافه شد",
      });
      window.dispatchEvent(new Event("cart-updated"));
      router.push("/cart");
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "خطا",
        description: "مشکلی در افزودن به سبد خرید پیش آمد",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isPosterEnabled) {
    return (
      <ProductUnavailableNotice
        title="فعلا پوستر نداریم :("
        description="درحال حاضر نمیتونیم پوستر تولید کنیم. اگه دوباره موجود بشه تو کانال تلگرام اطلاع میدیم."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="poster-select" className="text-sm">
          سایز پوستر
        </Label>
        <Select
          dir="rtl"
          value={selectedPosterId}
          onValueChange={setSelectedPosterId}
        >
          <SelectTrigger id="poster-select" className="h-12 bg-background/70">
            <SelectValue placeholder="سایز مورد نظر را انتخاب کنید" />
          </SelectTrigger>
          <SelectContent>
            {posters.map((poster) => (
              <SelectItem
                key={poster.id}
                value={poster.id}
                disabled={!poster.available}
              >
                <div className="flex w-full items-center justify-between gap-8">
                  <span
                    className={cn(
                      !poster.available && "line-through opacity-50",
                    )}
                  >
                    {poster.attribute}
                  </span>
                  {!poster.available && (
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

      <ProductPurchaseDock
        priceHint={`قیمت برای ${selectedPoster?.attribute || "سایز انتخابی"}`}
        priceDisplay={
          selectedPoster ? (
            <span className="inline-flex items-baseline gap-1">
              {formatPrice(parseInt(selectedPoster.price, 10))}
              <span className="text-base font-bold opacity-70">تومان</span>
            </span>
          ) : (
            <span className="text-sm font-normal text-muted-foreground">
              اول سایز رو انتخاب کن
            </span>
          )
        }
        onSubmit={handleAddToCart}
        isLoading={isLoading}
        canSubmit={Boolean(selectedPosterId)}
      />
    </div>
  );
}
