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

type Poster = {
  id: string;
  attribute: string;
  price: number;
  available: boolean;
  created_at: string;
};

type CustomPosterSelectorProps = {
  image_url: string;
  posters: Poster[];
  createdProductId?: string | null;
  loading: boolean;
};

// custom-poster-selector.tsx - بخش آپلود

/**
 * آپلود فایل از طریق /api/upload — storage provider is pluggable (S3/MinIO/Supabase).
 */
export async function uploadAndCreateProductWithFile(
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<{ product_id: string; image_url: string }> {
  try {
    console.log(`📤 شروع آپلود فایل: ${file.name} (${(file.size / 1024).toFixed(2)}KB)`);

    if (onProgress) onProgress(10);

    // Upload via API route
    const formData = new FormData();
    formData.append("file", file, file.name);
    formData.append("type", "poster");

    const uploadRes = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!uploadRes.ok) throw new Error("Upload failed");
    const { url: publicUrl } = await uploadRes.json();

    console.log(`✅ آپلود موفق:`, publicUrl);
    if (onProgress) onProgress(60);

    // Create product in database
    const productRes = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: publicUrl,
        name: "پوستر کاستوم",
        type: "poster",
        designer: userId,
        feed: false,
      }),
    });

    if (!productRes.ok) throw new Error("Failed to create product");
    const productData = await productRes.json();

    console.log(`✅ محصول ساخته شد:`, productData.id);
    if (onProgress) onProgress(100);

    return {
      product_id: productData.id,
      image_url: publicUrl,
    };
  } catch (error) {
    console.error("💥 خطای کلی در آپلود:", error);
    throw error;
  }
}

/**
 * تابع base64 wrapper — converts base64 to File, then delegates.
 */
export async function uploadAndCreateProduct(
  base64Image: string,
  userId: string
): Promise<{ product_id: string; image_url: string }> {
  const blob = await (await fetch(base64Image)).blob();
  const file = new File([blob], "poster.jpg", { type: "image/jpeg" });
  
  return uploadAndCreateProductWithFile(file, userId);
}

export { uploadAndCreateProductWithFile as uploadFile };

export function CustomPosterSelector(props: CustomPosterSelectorProps) {
  const [selectedPosterId, setSelectedPosterId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const selectedPosterData = props.posters.find(
    (pc) => pc.id === selectedPosterId
  );

  // check if user selected any item before in localstorage 
  useEffect(() => {
    const savedPosterId = localStorage.getItem("selectedPosterId");

    if (savedPosterId) {
      setSelectedPosterId(savedPosterId);
    }
  }, []);

  // add selected item to localstorage whenever user select something
  useEffect(() => {
    if (selectedPosterId) {
      localStorage.setItem("selectedPosterId", selectedPosterId);
    }
  }, [selectedPosterId]);

  const handleAddToCart = async () => {
    if (selectedPosterId) {
      toast({
        title: "لطفا سایز پوستر رو انتخاب کن",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: session } = await authClient.getSession();

      if (!session?.user) {
        localStorage.setItem("backTo", `/poster/custom`)
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
          posterId: selectedPosterId,
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
          <div className="space-y-2 w-full">
            <Select value={selectedPosterId} onValueChange={setSelectedPosterId}>
              <SelectTrigger id="poster-select">
                <SelectValue placeholder="سایز پوستر رو انتخاب کن" />
              </SelectTrigger>
              <SelectContent>
                {props.posters.map((atr) => (
                  <SelectItem key={atr.id} value={atr.attribute}>
                    <div className="flex items-center justify-between w-full">
                        <span className={cn(!atr.available && 'line-through')}>
                        {atr.attribute}
                        </span>
                        {!atr.available &&
                        <span className="text-red-400 px-2">
                            ناموجود
                        </span>
                        }
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
              {selectedPosterData ? (
                <div className="gap-1 text-xl inline-flex items-center">
                  {new Intl.NumberFormat("fa-IR").format(
                    selectedPosterData.price
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
            !selectedPosterId ||
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
