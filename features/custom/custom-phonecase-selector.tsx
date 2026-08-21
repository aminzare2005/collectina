"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { Loader2 } from "lucide-react";
import { TomanIcon } from "@/components/ui/toman-icon";
import { cn } from "@/lib/utils";

type PhoneCase = {
  id: string;
  brand: string;
  model: string;
  price: number;
  available: boolean;
  created_at: string;
};

type CustomPhoneCaseSelectorProps = {
  image_url: string;
  phoneCases: PhoneCase[];
  createdProductId?: string | null;
  loading: boolean;
};

export function CustomPhoneCaseSelector(props: CustomPhoneCaseSelectorProps) {
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [selectedPhoneCaseId, setSelectedPhoneCaseId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const groupedPhoneCases = props.phoneCases.reduce(
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

  const selectedPhoneCase = props.phoneCases.find(
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
  }, [props.phoneCases]);

  useEffect(() => {
    if (selectedBrand) {
      localStorage.setItem("selectedBrand", selectedBrand);
    }
  }, [selectedBrand]);

  useEffect(() => {
    if (selectedPhoneCaseId) {
      localStorage.setItem("selectedPhoneCaseId", selectedPhoneCaseId);
    }
  }, [selectedPhoneCaseId]);

  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
    setSelectedPhoneCaseId("");
  };

  const handleAddToCart = async () => {
    if (!selectedBrand || !selectedPhoneCaseId) {
      toast({
        title: "لطفا برند و مدل گوشی خود را انتخاب کنید",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: session } = await authClient.getSession();

      if (!session?.user) {
        localStorage.setItem("backTo", `/phonecase/custom`);
        router.push(`/auth/login`);
        return;
      }

      let productIdToUse = props.createdProductId;

      // اگر محصول از قبل ایجاد نشده، حالا ایجادش کن
      if (!productIdToUse) {
        if (!props.image_url) {
          toast({
            title: "لطفا ابتدا تصویر را آپلود کنید",
            variant: "destructive",
          });
          return;
        }

        // آپلود تصویر و ایجاد محصول جدید
        const result = await uploadAndCreateProduct(
          props.image_url,
          session.user.id,
        );
        productIdToUse = result.product_id;
      }

      // اضافه کردن به سبد خرید
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: productIdToUse,
          phoneCaseId: selectedPhoneCaseId,
        }),
      });
      if (!res.ok) throw new Error("Failed to add to cart");

      router.push("/cart");
      toast({
        title: "محصول به سبد خرید اضافه شد",
      });

      router.refresh();
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      toast({
        title: "خطا",
        description: error.message || "مشکلی در افزودن به سبد خرید پیش آمد",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div>
        <div className="flex md:flex-row flex-col items-center justify-center gap-2 w-full">
          {/* Brand Selection */}
          <div className="space-y-2 w-full">
            <Select value={selectedBrand} onValueChange={handleBrandChange}>
              <SelectTrigger id="brand-select">
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

          {/* Model Selection */}
          <div className="space-y-2 w-full">
            <Select
              disabled={!selectedBrand}
              value={selectedPhoneCaseId}
              onValueChange={setSelectedPhoneCaseId}
            >
              <SelectTrigger id="model-select">
                <SelectValue placeholder="مدل گوشیت رو انتخاب کن" />
              </SelectTrigger>
              <SelectContent>
                {brandPhoneCases.map((phoneCase) => (
                  <SelectItem
                    key={phoneCase.id}
                    value={phoneCase.id}
                    disabled={!phoneCase.available}
                  >
                    <div className="flex items-center justify-between w-full gap-2">
                      <span
                        className={cn(!phoneCase.available && "opacity-80")}
                      >
                        {phoneCase.model}
                      </span>
                      {!phoneCase.available && (
                        <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-bold">
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
      </div>

      <div className="p-4 border border-input rounded-xl">
        {/* Price Section */}
        <div className="mb-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">قیمت:</span>
            <span className="text-2xl font-bold text-primary min-h-8">
              {selectedPhoneCase ? (
                <div className="gap-1 text-xl inline-flex items-center">
                  {new Intl.NumberFormat("fa-IR").format(
                    selectedPhoneCase.price,
                  )}
                  <TomanIcon className="size-4" />
                </div>
              ) : (
                ""
              )}
            </span>
          </div>
        </div>

        <Button
          id="AddToCartButton"
          onClick={handleAddToCart}
          disabled={
            !selectedBrand ||
            !selectedPhoneCaseId ||
            isLoading ||
            !props.image_url ||
            props.loading
          }
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              در حال افزودن...
            </>
          ) : (
            "افزودن به سبد خرید"
          )}
        </Button>
      </div>
    </div>
  );
}

// Upload image and create product via API routes
export const uploadAndCreateProduct = async (
  image_url: string,
  user_id: string,
) => {
  let finalImage = "";

  if (!image_url) {
    throw new Error("Image URL is required");
  }

  try {
    // آپلود تصویر via API route
    const blob = await fetch(image_url).then((r) => r.blob());
    const formData = new FormData();
    formData.append("file", blob, "phonecase.png");
    formData.append("type", "phonecase");

    const uploadRes = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    if (!uploadRes.ok) throw new Error("Upload failed");
    const { url } = await uploadRes.json();
    finalImage = url;

    // ایجاد محصول جدید و دریافت ID
    const productRes = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: finalImage,
        name: "قاب موبایل کاستوم",
        type: "phonecase",
        designer: user_id,
        feed: false,
      }),
    });
    if (!productRes.ok) throw new Error("Failed to create product");
    const productData = await productRes.json();

    return { success: true, product_id: productData.id, image_url: finalImage };
  } catch (error) {
    console.error("Error in uploadAndCreateProduct:", error);
    throw error;
  }
};
