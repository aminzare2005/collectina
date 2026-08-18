"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  priceHint: string;
  priceDisplay: React.ReactNode;
  onSubmit: () => void;
  isLoading: boolean;
  canSubmit: boolean;
  submitLabel?: string;
  className?: string;
  children?: React.ReactNode;
};

export function ProductPurchaseDock({
  priceHint,
  priceDisplay,
  onSubmit,
  isLoading,
  canSubmit,
  submitLabel = "افزودن به سبد خرید",
  className,
  children,
}: Props) {
  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 mx-auto w-full max-w-2xl p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:static md:max-w-none md:p-0",
        className,
      )}
    >
      <div className="space-y-4 rounded-2xl border border-input bg-background/90 p-4 shadow-2xl backdrop-blur-md md:border-border/60 md:bg-card/50 md:shadow-none">
        {children}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-0.5">
            <p className="text-xs text-muted-foreground">{priceHint}</p>
            <div className="text-2xl font-black leading-none tracking-tight">
              {priceDisplay}
            </div>
          </div>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit || isLoading}
            size="lg"
            className="h-12 w-full text-base font-bold shadow-lg shadow-primary/15 sm:w-auto sm:min-w-[168px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                در حال پردازش...
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
