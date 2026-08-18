"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { CartItem, CartItemSkeleton } from "@/components/cart-item";
import {
  CheckoutForm,
  type CheckoutFormControls,
  type CheckoutFormUiState,
} from "@/components/checkout-form";
import EmptyCommon from "@/components/empty-common";
import { ArrowLeftIcon, LogInIcon, User2Icon } from "lucide-react";
import { Profile } from "@/lib/types/database";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import CartPosterSuggestion from "@/components/cart-poster-suggestion";
import CartShippingNotice from "@/components/cart-shipping-notice";
import CartPriceSummary from "@/components/cart-price-summary";
import { calculateCartShipping } from "@/lib/shipping";
import { useResizeObserverHeight } from "@/hooks/use-resize-observer-height";

// ===========================
// Types & Interfaces
// ===========================

type ProductType = "phonecase" | "poster";

interface NormalizedCartItem {
  id: string;
  quantity: number;
  productId: string;
  name: string;
  image_url: string;
  type: ProductType;
  price: number;
  available: boolean;
  variantLabel?: string;
}

interface Discount {
  discountAmount: number;
  freeShipping: boolean;
}

// ===========================
// Helper Functions
// ===========================

const formatNumber = (n: number): string =>
  new Intl.NumberFormat("fa-IR").format(n);

// ===========================
// Main Component
// ===========================

export default function CartCheckoutPage() {
  const supabase = createClient();
  const checkoutRef = useRef<HTMLDivElement>(null);
  const stickySummaryRef = useRef<HTMLDivElement>(null);
  const checkoutControlsRef = useRef<CheckoutFormControls | null>(null);

  const [checkoutUi, setCheckoutUi] = useState<CheckoutFormUiState>({
    canSubmit: false,
    isLoading: false,
    payAmount: 0,
  });

  const handleCheckoutUiChange = useCallback((state: CheckoutFormUiState) => {
    setCheckoutUi(state);
  }, []);

  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cartItems, setCartItems] = useState<NormalizedCartItem[]>([]);
  const [postPrice, setPostPrice] = useState(0);
  const [discount, setDiscount] = useState<Discount | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setIsAuthenticated(false);
          return;
        }

        setIsAuthenticated(true);

        const [
          { data: cart, error: cartError },
          { data: profile, error: profileError },
          { data: settings, error: settingsError },
        ] = await Promise.all([
          supabase
            .from("cart_items")
            .select(
              `
              id,
              quantity,
              products!inner (
                id,
                name,
                image_url,
                type
              ),
              phone_cases (
                model,
                price,
                available
              ),
              posters (
                attribute,
                price,
                available
              )
            `,
            )
            .eq("user_id", user.id),

          supabase.from("profiles").select("*").eq("id", user.id).single(),

          supabase.from("settings").select("post_price").single(),
        ]);

        if (cartError) {
          console.error("Cart fetch error:", cartError);
          throw new Error("خطا در دریافت سبد خرید");
        }
        if (profileError) console.error("Profile fetch error:", profileError);
        if (settingsError)
          console.error("Settings fetch error:", settingsError);

        const normalized: NormalizedCartItem[] = (cart || []).map(
          (item: any) => {
            const product = Array.isArray(item.products)
              ? item.products[0]
              : item.products;
            const phoneCase = Array.isArray(item.phone_cases)
              ? item.phone_cases[0]
              : item.phone_cases;
            const poster = Array.isArray(item.posters)
              ? item.posters[0]
              : item.posters;

            if (product.type === "phonecase" && phoneCase) {
              return {
                id: item.id,
                quantity: item.quantity,
                productId: product.id,
                name: product.name,
                image_url: product.image_url,
                type: "phonecase" as ProductType,
                price: phoneCase.price,
                available: phoneCase.available,
                variantLabel: phoneCase.model,
              };
            }

            if (product.type === "poster" && poster) {
              return {
                id: item.id,
                quantity: item.quantity,
                productId: product.id,
                name: product.name,
                image_url: product.image_url,
                type: "poster" as ProductType,
                price: poster.price,
                available: poster.available,
                variantLabel: poster.attribute,
              };
            }

            throw new Error(`نوع محصول نامعتبر: ${product.type}`);
          },
        );

        setCartItems(normalized);
        setProfile(profile);
        setPostPrice(settings?.post_price ?? 0);
      } catch (error) {
        console.error("Fetch data error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleQuantityChange = (id: string, newQuantity: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item,
      ),
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems]);

  const shipping = useMemo(
    () =>
      calculateCartShipping({
        postPricePerShipment: postPrice,
        productTypes: cartItems.map((item) => item.type),
        freeShipping: discount?.freeShipping ?? false,
      }),
    [cartItems, postPrice, discount?.freeShipping],
  );

  const shippingPrice = shipping.total;
  const discountAmount = discount?.discountAmount ?? 0;
  const finalTotal = Math.max(subtotal + shippingPrice - discountAmount, 0);

  const stickySummaryHeight = useResizeObserverHeight(stickySummaryRef, [
    shipping.shipmentCount,
    shipping.total,
    discountAmount,
    cartItems.length,
    checkoutUi.canSubmit,
  ]);

  const handleStickyPrimaryAction = () => {
    checkoutControlsRef.current?.requestPayment();
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto flex flex-col gap-4">
        <h1 className="text-2xl font-bold">سبد خرید</h1>
        {Array.from({ length: 3 }).map((_, idx) => (
          <CartItemSkeleton key={idx} />
        ))}
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto space-y-4">
        <EmptyCommon
          title="برای دیدن سبد خرید وارد شو"
          description="محصولات انتخابی‌ات بعد از ورود اینجا نمایش داده می‌شن"
          icon={<LogInIcon />}
        />
        <div className="flex justify-center">
          <Button asChild size="lg" className="h-11">
            <Link
              href="/auth/login"
              onClick={() => localStorage.setItem("backTo", "/cart")}
            >
              ورود / ثبت‌نام
              <ArrowLeftIcon />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!cartItems.length) {
    return (
      <div className="max-w-xl mx-auto space-y-4">
        <EmptyCommon
          title="سبد خرید شما خالی است"
          description="یه محصول جدید انتخاب کن و به سبدت اضافه کن"
          button="بازگشت به صفحه اصلی"
          buttonIcon={<ArrowLeftIcon />}
          isButton
        />
        <div className="text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <User2Icon className="size-4" />
            داشبورد کاربری
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="max-w-xl mx-auto flex flex-col gap-8 md:max-w-none"
      style={{ paddingBottom: stickySummaryHeight }}
    >
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">سبد خرید</h1>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <User2Icon className="size-4" />
          داشبورد
        </Link>
      </div>

      <div className="flex flex-col gap-8 md:grid md:grid-cols-2 md:items-start">
        <div className="flex min-w-0 flex-col gap-8">
          <section
            className="flex flex-col gap-4 w-full"
            aria-label="آیتم‌های سبد"
          >
            {cartItems.map((item) => (
              <CartItem
                key={item.id}
                id={item.id}
                productId={item.productId}
                name={item.name}
                price={item.price}
                image_url={item.image_url}
                type={item.type}
                quantity={item.quantity}
                variantLabel={item.variantLabel}
                available={item.available}
                onQuantityChange={handleQuantityChange}
                onRemove={handleRemoveItem}
              />
            ))}
            <Link
              href="/"
              className="text-center text-sm text-muted-foreground hover:text-foreground py-1"
            >
              ادامه خرید
            </Link>
          </section>

          <CartPosterSuggestion />
        </div>

        <div className="flex min-w-0 flex-col gap-8">
          <section
            ref={checkoutRef}
            id="checkout"
            className="w-full scroll-mt-28 rounded-2xl border border-border/60 bg-card/40 px-4 py-6 md:px-5"
            style={{ scrollMarginBottom: stickySummaryHeight }}
            aria-label="اطلاعات ارسال"
          >
            <div className="mb-5 space-y-3 text-center md:text-start">
              <nav
                aria-label="مراحل خرید"
                className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground md:justify-start"
              >
                <span>سبد خرید</span>
                <span aria-hidden>·</span>
                <span className="font-medium text-foreground">
                  اطلاعات ارسال
                </span>
                <span aria-hidden>·</span>
                <span>پرداخت</span>
              </nav>
              <div className="space-y-1">
                <h2 className="text-xl font-bold md:text-2xl">اطلاعات ارسال</h2>
                <p className="text-sm text-muted-foreground">
                  آدرس و شماره تماس رو دقیق وارد کن تا سفارشت درست برسه
                </p>
              </div>
            </div>
            <CheckoutForm
              profile={profile}
              total={subtotal + shippingPrice}
              productTypes={cartItems.map((item) => item.type)}
              onDiscountChange={setDiscount}
              controlsRef={checkoutControlsRef}
              onUiStateChange={handleCheckoutUiChange}
            />

            <div className="mt-4">
              <CartShippingNotice
                shipping={shipping}
                postPricePerShipment={postPrice}
              />
            </div>

            <div className="hidden md:block border-t border-border/60 pt-5 mt-6">
              <p className="text-sm font-semibold mb-3">خلاصه پرداخت</p>
              <CartPriceSummary
                subtotal={subtotal}
                shipping={shipping}
                shippingPrice={shippingPrice}
                discountAmount={discountAmount}
                finalTotal={finalTotal}
              />
              <Button
                type="button"
                className="h-12 w-full text-base font-semibold mt-4"
                onClick={handleStickyPrimaryAction}
                disabled={checkoutUi.isLoading}
              >
                {checkoutUi.isLoading
                  ? "در حال پردازش..."
                  : checkoutUi.canSubmit
                    ? `پرداخت ${formatNumber(checkoutUi.payAmount)} تومان`
                    : "تکمیل اطلاعات ارسال"}
                <ArrowLeftIcon className="size-5" />
              </Button>
            </div>
          </section>
        </div>
      </div>

      <div
        ref={stickySummaryRef}
        className="fixed z-50 bottom-0 left-0 right-0 mx-auto w-full max-w-2xl p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden"
      >
        <div className="rounded-xl border border-input bg-background/90 p-4 shadow-lg backdrop-blur-md">
          <CartPriceSummary
            collapsible
            subtotal={subtotal}
            shipping={shipping}
            shippingPrice={shippingPrice}
            discountAmount={discountAmount}
            finalTotal={finalTotal}
          />

          <Button
            type="button"
            className="h-12 w-full text-base font-semibold mt-2"
            onClick={handleStickyPrimaryAction}
            disabled={checkoutUi.isLoading}
          >
            {checkoutUi.isLoading
              ? "در حال پردازش..."
              : checkoutUi.canSubmit
                ? `پرداخت ${formatNumber(checkoutUi.payAmount)} تومان`
                : "تکمیل اطلاعات ارسال"}
            <ArrowLeftIcon className="size-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
