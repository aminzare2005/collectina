"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2 } from "lucide-react";
import { TomanIcon } from "@/components/ui/toman-icon";

import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import PhonecaseCard from "./phonecaseCard";
import PosterCard from "./poster-card";
import { cn } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";

type ProductType = "phonecase" | "poster";

interface CartItemProps {
  id: string;
  productId: string;
  name: string;
  price: number;
  image_url: string;
  type: ProductType;
  quantity: number;
  variantLabel?: string;
  available: boolean;
  onQuantityChange: (id: string, newQuantity: number) => void;
  onRemove: (id: string) => void;
}

export function CartItem({
  id,
  productId,
  name,
  price,
  image_url,
  type,
  quantity,
  variantLabel,
  available,
  onQuantityChange,
  onRemove,
}: CartItemProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const formattedPrice = useMemo(
    () => new Intl.NumberFormat("fa-IR").format(price),
    [price],
  );

  const updateQuantity = async (newQuantity: number) => {
    if (newQuantity < 1 || isLoading) return;

    // Optimistic update
    onQuantityChange(id, newQuantity);
    setIsLoading(true);

    try {
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, quantity: newQuantity }),
      });
      if (!res.ok) throw new Error("Failed to update quantity");
    } catch (error: any) {
      // Revert on error
      onQuantityChange(id, quantity);
      toast({
        title: "خطا",
        description: error?.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async () => {
    if (isLoading) return;

    // Optimistic remove
    onRemove(id);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/cart?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove item");

      window.dispatchEvent(new Event("cart-updated"));
      toast({
        title: "محصول از سبد خرید حذف شد",
      });
    } catch {
      toast({
        title: "مشکلی در حذف محصول پیش آمد",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderImage = () => {
    if (type === "phonecase") {
      return (
        <div className="w-24">
          <PhonecaseCard
            size="small"
            image_url={image_url}
            href={`/phonecase/${productId}`}
          />
        </div>
      );
    }

    return (
      <div className="w-24">
        <PosterCard
          size="small"
          image_url={image_url}
          href={`/poster/${productId}`}
        />
      </div>
    );
  };

  return (
    <Card
      className={cn(
        "w-full bg-card border p-4 rounded-2xl overflow-hidden transition-all",
        isLoading && "opacity-70",
      )}
    >
      <div className="grid grid-cols-5 items-center gap-4">
        <div className="flex justify-center h-full items-center">
          {renderImage()}
        </div>

        <div className="col-span-3 flex flex-col h-full justify-between gap-1">
          <div>
            <h2 className="text-2xl font-semibold opacity-90">{name}</h2>
            <p className="text-lg text-muted-foreground">
              {type === "phonecase"
                ? "قاب موبایل"
                : type === "poster"
                  ? "پوستر"
                  : ""}{" "}
              {variantLabel}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-xl flex gap-1 items-center font-medium">
              <TomanIcon className="size-4" />
              <span>{formattedPrice}</span>
            </div>
            {!available && (
              <span className="text-xs text-red-500">(ناموجود)</span>
            )}
          </div>
        </div>

        <div className="col-span-1 flex flex-col items-end gap-2">
          <div className="flex flex-col items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => updateQuantity(quantity + 1)}
              disabled={isLoading || !available}
            >
              <Plus className="size-4" />
            </Button>

            <span className="text-sm font-semibold">{quantity}</span>

            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => updateQuantity(quantity - 1)}
              disabled={isLoading || quantity <= 1}
            >
              <Minus className="size-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="text-red-500 size-8"
            onClick={removeItem}
            disabled={isLoading}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
