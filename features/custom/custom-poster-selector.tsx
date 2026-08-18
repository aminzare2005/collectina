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
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
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

import { SupabaseClient } from "@supabase/supabase-js";

/**
 * آپلود فایل به جای base64 - بهینه‌تر و سریع‌تر
 */
export async function uploadAndCreateProductWithFile(
  file: File,
  userId: string,
  supabase: SupabaseClient,
  onProgress?: (progress: number) => void
): Promise<{ product_id: string; image_url: string }> {
  try {
    // 1. ساخت نام یونیک برای فایل
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileExtension = file.name.split(".").pop() || "jpg";
    const fileName = `custom-poster-${userId}-${timestamp}-${randomString}.${fileExtension}`;

    console.log(`📤 شروع آپلود فایل: ${fileName} (${(file.size / 1024).toFixed(2)}KB)`);

    // شبیه‌سازی progress برای مراحل مختلف
    if (onProgress) onProgress(10);

    // 2. آپلود به Supabase Storage با timeout مناسب
    const uploadStartTime = Date.now();
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("custom-poster") // نام bucket رو با bucket واقعیت عوض کن
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    const uploadTime = ((Date.now() - uploadStartTime) / 1000).toFixed(2);

    if (uploadError) {
      console.error("❌ خطا در آپلود:", uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    console.log(`✅ آپلود موفق در ${uploadTime}s:`, uploadData.path);
    if (onProgress) onProgress(60);

    // 3. گرفتن URL عمومی فایل
    const { data: urlData } = supabase.storage
      .from("custom-poster")
      .getPublicUrl(uploadData.path);

    const publicUrl = urlData.publicUrl;
    console.log(`🔗 Public URL:`, publicUrl);
    if (onProgress) onProgress(80);

    // 4. ذخیره در دیتابیس
    const { data: productData, error: dbError } = await supabase
      .from("products") // نام table رو با table واقعیت عوض کن
      .insert({
        image_url: publicUrl,
        name: "پوستر کاستوم",
        type: "poster",
        designer: userId,
        feed: false,
      })
      .select()
      .single();

    if (dbError) {
      console.error("❌ خطا در ذخیره دیتابیس:", dbError);
      
      // اگر دیتابیس خطا داد، فایل رو پاک کن
      await supabase.storage
        .from("custom-poster")
        .remove([uploadData.path]);
      
      throw new Error(`Database error: ${dbError.message}`);
    }

    console.log(`✅ محصول ساخته شد:`, productData.id);
    if (onProgress) onProgress(100);

    return {
      product_id: productData.id,
      image_url: publicUrl,
    };
  } catch (error: any) {
    console.error("💥 خطای کلی در آپلود:", error);
    
    // اطلاعات دیباگ بیشتر
    if (error.message) {
      console.error("Message:", error.message);
    }
    if (error.code) {
      console.error("Code:", error.code);
    }
    
    throw error;
  }
}

/**
 * تابع قدیمی با base64 (برای compatibility)
 * توصیه: از uploadAndCreateProductWithFile استفاده کنید
 */
export async function uploadAndCreateProduct(
  base64Image: string,
  userId: string,
  supabase: SupabaseClient
): Promise<{ product_id: string; image_url: string }> {
  // تبدیل base64 به File
  const blob = await (await fetch(base64Image)).blob();
  const file = new File([blob], "custom-poster.jpg", { type: "image/jpeg" });
  
  return uploadAndCreateProductWithFile(file, userId, supabase);
}


// finalImage = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${uploadData.fullPath}`;

//     // ایجاد محصول جدید و دریافت ID
//     const { data: productData, error: addCustomPosterError } = await supabase
//       .from("products")
//       .insert({
//         image_url: finalImage,
//         name: "پوستر کاستوم",
//         type: "poster",
//         designer: user_id,
//         feed: false,
//       })
//       .select("id")
//       .single();

// Export کردن هر دوی توابع برای سازگاری
export { uploadAndCreateProductWithFile as uploadFile };

export function CustomPosterSelector(props: CustomPosterSelectorProps) {
  const [selectedPosterId, setSelectedPosterId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

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
        title: "خطا",
        description: "لطفا سایز پوستر رو انتخاب کن",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        localStorage.setItem("backTo", `/poster/custom`)
        router.push(`/auth/login`);
        return;
      }

      let productIdToUse = props.createdProductId;

      // اگر محصول از قبل ایجاد نشده، حالا ایجادش کن
      if (!productIdToUse) {
        if (!props.image_url) {
          toast({
            title: "خطا",
            description: "لطفا ابتدا تصویر را آپلود کنید",
            variant: "destructive",
          });
          return;
        }

        // آپلود تصویر و ایجاد محصول جدید
        const result = await uploadAndCreateProduct(
          props.image_url,
          user.id,
          supabase
        );
        productIdToUse = result.product_id;
      }

      // اضافه کردن به سبد خرید
      const { error } = await supabase.from("cart_items").insert({
        user_id: user.id,
        product_id: productIdToUse,
        poster_id: selectedPosterId,
        quantity: 1,
      });

      if (error) throw error;

      router.push("/cart");
      toast({
        title: "موفق",
        description: "محصول به سبد خرید اضافه شد",
      });

      router.refresh();
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
                  تومان
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
