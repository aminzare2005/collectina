"use client";

import { useEffect, useRef, useState } from "react";

import {
  Download,
  ImageIcon,
  ImagePlusIcon,
  ShoppingBasket,
  Upload,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import PosterCardSkeleton from "@/components/poster-card-skeleton";
import PosterCard from "@/components/poster-card";
import {
  CustomPosterSelector,
  uploadAndCreateProductWithFile,
} from "./custom-poster-selector";
import { Progress } from "@/components/ui/progress";

// تابع فشرده‌سازی تصویر
const compressImage = async (
  file: File,
  maxWidth = 1200,
  quality = 0.85,
): Promise<{ blob: Blob; dataUrl: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // محاسبه ابعاد جدید با حفظ نسبت تصویر
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        // رندر تصویر با کیفیت بهتر
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // تبدیل به blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to create blob"));
              return;
            }

            // ساخت data URL برای پیش‌نمایش
            const dataUrl = canvas.toDataURL("image/jpeg", quality);
            resolve({ blob, dataUrl });
          },
          "image/jpeg",
          quality,
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

export default function CustomPosterPageClient({ poster }: { poster: any[] }) {
  const { toast } = useToast();
  const supabase = createClient();
  const [imageUrl, setImageUrl] = useState("");
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [isAddingToProducts, setIsAddingToProducts] = useState(false);
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);

  useEffect(() => {
    const loadSavedImage = async () => {
      const savedImage = localStorage.getItem("customPosterPreviewImage");
      if (savedImage) {
        setIsImageLoading(true);

        await new Promise((resolve) => setTimeout(resolve, 300));

        const img = new Image();
        img.onload = () => {
          setImageUrl(savedImage);
          setIsImageLoading(false);
        };
        img.onerror = () => {
          localStorage.removeItem("customPosterPreviewImage");
          setIsImageLoading(false);
        };
        img.src = savedImage;
      }
    };

    loadSavedImage();
  }, []);

  const handleFileChange = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "فایل باید حتما تصویر باشه",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "حجم فایل باید کمتر از 20 مگابایت باشه",
        variant: "destructive",
      });
      return;
    }

    setIsImageLoading(true);
    setUploadProgress(0);

    try {
      // فشرده‌سازی تصویر
      const { blob, dataUrl } = await compressImage(file, 1200, 0.85);

      // ساخت فایل جدید از blob
      const compressedFile = new File([blob], file.name, {
        type: "image/jpeg",
        lastModified: Date.now(),
      });

      // نمایش حجم قبل و بعد
      const originalSizeKB = (file.size / 1024).toFixed(2);
      const compressedSizeKB = (compressedFile.size / 1024).toFixed(2);
      const reduction = (
        ((file.size - compressedFile.size) / file.size) *
        100
      ).toFixed(0);

      console.log(
        `🖼️ Original: ${originalSizeKB}KB → Compressed: ${compressedSizeKB}KB (${reduction}% کاهش)`,
      );

      // ذخیره فایل فشرده شده
      setOriginalFile(compressedFile);
      setImageUrl(dataUrl);
      localStorage.setItem("customPosterPreviewImage", dataUrl);
      setCreatedProductId(null);
      setIsImageLoading(false);

      toast({
        title: "✅ تصویر آماده شد",
        description: `حجم: ${originalSizeKB}KB → ${compressedSizeKB}KB`,
      });
    } catch (error) {
      console.error("Error processing image:", error);
      setIsImageLoading(false);
      toast({
        title: "خطا در پردازش تصویر",
        description: "لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    }
  };

  const handleRemoveImage = () => {
    setImageUrl("");
    setOriginalFile(null);
    setUploadProgress(0);
    localStorage.removeItem("customPosterPreviewImage");
    setCreatedProductId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileChange(files[0]);
    }
  };

  const handleAddToProducts = async () => {
    if (!imageUrl || !originalFile) {
      toast({
        title: "ابتدا یک تصویر انتخاب کنید",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setIsAddingToProducts(true);
    setUploadProgress(0);

    const maxRetries = 2;
    let retryCount = 0;

    const attemptUpload = async (): Promise<any> => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          localStorage.setItem("backTo", `/poster/custom`);
          router.push(`/auth/login`);
          return;
        }

        console.log(
          `📤 شروع آپلود... (تلاش ${retryCount + 1}/${maxRetries + 1})`,
        );

        // استفاده از فایل به جای base64
        const result = await uploadAndCreateProductWithFile(
          originalFile,
          user.id,
          supabase,
          (progress: any) => {
            setUploadProgress(progress);
          },
        );

        return result;
      } catch (error: any) {
        console.error(`❌ خطا در تلاش ${retryCount + 1}:`, error);

        // بررسی نوع خطا و retry
        const isRetryableError =
          error.message?.includes("ERR_HTTP2_PROTOCOL_ERROR") ||
          error.message?.includes("timeout") ||
          error.message?.includes("network") ||
          error.code === "PGRST301";

        if (retryCount < maxRetries && isRetryableError) {
          retryCount++;
          const waitTime = retryCount * 2000; // 2s, 4s

          toast({
            title: `🔄 تلاش مجدد ${retryCount}/${maxRetries}`,
            description: `لطفاً ${waitTime / 1000} ثانیه صبر کنید...`,
          });

          await new Promise((resolve) => setTimeout(resolve, waitTime));
          setUploadProgress(0);
          return attemptUpload();
        }

        throw error;
      }
    };

    try {
      const result = await attemptUpload();
      setCreatedProductId(result.product_id);
      setUploadProgress(100);

      toast({
        title: "✅ پوستر پیشنهادیت به دست ما رسید!",
        description: "حالا می‌تونی به سبد خرید اضافه کنی",
      });

      router.refresh();
    } catch (error: any) {
      console.error("💥 Error adding to products:", error);
      setUploadProgress(0);

      let errorMessage = "مشکلی در ارسال پیشنهاد پیش اومد";
      let errorDescription = "لطفاً دوباره تلاش کنید";

      if (error.message?.includes("ERR_HTTP2_PROTOCOL_ERROR")) {
        errorMessage = "خطا در ارتباط با سرور";
        errorDescription = "لطفاً اتصال اینترنت خود را بررسی کنید";
      } else if (error.message?.includes("timeout")) {
        errorMessage = "زمان آپلود تمام شد";
        errorDescription = "تصویر شما ممکنه خیلی بزرگ باشه";
      } else if (error.code === "PGRST301") {
        errorMessage = "محدودیت حجم فایل";
        errorDescription = "لطفاً تصویر کوچکتری انتخاب کنید";
      }

      toast({
        title: errorMessage,
        description: errorDescription,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsAddingToProducts(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 md:gap-12 pb-20 md:pb-4">
      {/* Product Image Section */}
      <div className="w-full md:w-1/3">
        <div className="flex items-center justify-center p-4 md:p-0">
          <div
            className="w-2/3 md:w-full cursor-pointer relative"
            onClick={() => !isImageLoading && fileInputRef.current?.click()}
          >
            {isImageLoading ? (
              <PosterCardSkeleton />
            ) : (
              <>
                <PosterCard
                  size="big"
                  image_url={imageUrl}
                  className="pointer-events-none"
                />
                {/* Progress Overlay */}
                {isAddingToProducts && uploadProgress > 0 && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-xl">
                    <div className="w-3/4 space-y-3">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                        <span className="text-white font-medium">
                          در حال آپلود...
                        </span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-center text-white text-sm">
                        {uploadProgress}%
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <div className="w-full flex flex-col gap-4 justify-between">
        {/* Upload Section */}
        <div className="flex flex-col gap-4">
          <div className="opacity-70 cursor-pointer inline-flex flex-wrap gap-x-2 font-light text-sm">
            <Link href={"/"}>کالکتینا</Link>/<Link href={"/poster"}>پوستر</Link>
            /<Link href={"/poster/custom"}>کاستوم</Link>
          </div>
          {/* Header */}
          <h1 className="text-3xl lg:text-4xl font-bold text-white pb-4">
            پوستر کاستوم
          </h1>
          <div
            className={`
                    border-2 hidden md:block w-full border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                    ${
                      isDragging
                        ? "border-blue-500 bg-blue-500/10"
                        : imageUrl && !isImageLoading
                          ? createdProductId
                            ? "border-green-600/70 bg-green-500/5"
                            : "border-green-600/70 bg-green-500/5"
                          : "border-zinc-700 hover:border-zinc-600"
                    }
                    ${
                      isImageLoading ? "border-yellow-500 bg-yellow-500/10" : ""
                    }
                  `}
            onClick={() => !isImageLoading && fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileChange(file);
              }}
              className="hidden"
              disabled={isImageLoading}
            />

            <div className="flex min-h-36 flex-col items-center justify-center gap-3">
              {isImageLoading ? (
                <>
                  <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      در حال پردازش تصویر...
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      تصویر در حال فشرده‌سازی است
                    </p>
                  </div>
                </>
              ) : imageUrl ? (
                <>
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      createdProductId ? "bg-green-500" : "bg-green-500"
                    }`}
                  >
                    <ImageIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {createdProductId
                        ? "✅ محصول آماده افزودن به سبد خرید است"
                        : "تصویر با موفقیت آماده شد"}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      {createdProductId
                        ? "می‌توانید به سبد خرید اضافه کنید"
                        : "برای تغییر تصویر، اینجا کلیک کنید"}
                    </p>
                  </div>
                  {/* Progress Bar در حالت آپلود */}
                  {isAddingToProducts && uploadProgress > 0 && (
                    <div className="w-full max-w-md mt-4 space-y-2">
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-sm text-gray-400">
                        در حال آپلود: {uploadProgress}%
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                    <Upload className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-white font-medium">
                      {isDragging
                        ? "رها کنید"
                        : "تصویر خود را اینجا آپلود کنید"}
                    </p>
                    <div className="flex items-center gap-1 text-xs opacity-80">
                      <span>•</span>
                      <span>فرمت‌های مجاز: JPG, PNG, WebP</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs opacity-80">
                      <span>•</span>
                      <span>سایز پیشنهادی: A4, A3</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs opacity-80">
                      <span>•</span>
                      <span>حداکثر: 20 مگابایت</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="fixed md:static z-50 bottom-3 right-3 left-3 md:p-0 p-4 backdrop-blur-sm bg-background/50 md:border-0 border border-input rounded-xl">
            <div className="flex justify-between md:justify-start gap-2">
              {imageUrl && !isImageLoading ? (
                <div className="flex gap-2">
                  <Button
                    variant={"destructive"}
                    size={"icon-lg"}
                    onClick={handleRemoveImage}
                    disabled={isLoading || isImageLoading}
                  >
                    <X className="size-6" />
                  </Button>
                  <Link className="md:hidden" href={"#AddToCartButton"}>
                    <Button variant={"outline"} size={"icon-lg"}>
                      <ShoppingBasket className="size-6" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <Button
                  variant={"outline"}
                  size={"lg"}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImageLoading}
                >
                  <Upload className="size-6" />
                  آپلود عکس
                </Button>
              )}
              <Button
                variant={"outline"}
                size={"lg"}
                disabled={
                  !imageUrl ||
                  isAddingToProducts ||
                  !!createdProductId ||
                  isImageLoading
                }
                onClick={handleAddToProducts}
              >
                {isAddingToProducts ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="size-5 animate-spin" />
                    <span className="hidden sm:inline">
                      {uploadProgress > 0
                        ? `${uploadProgress}%`
                        : "در حال آپلود..."}
                    </span>
                  </div>
                ) : createdProductId ? (
                  <>
                    <ImageIcon className="size-6" />
                    ارسال شده
                  </>
                ) : (
                  <>
                    <ImagePlusIcon className="size-6" />
                    ارسال پیشنهاد
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
        <div>
          <CustomPosterSelector
            image_url={imageUrl}
            posters={poster}
            createdProductId={createdProductId}
            loading={isLoading || isImageLoading}
          />
        </div>
      </div>
    </div>
  );
}
