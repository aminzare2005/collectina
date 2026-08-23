"use client";

import { useEffect, useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Gateway {
  id: string;
  name: string;
}

interface PaymentMethodSelectorProps {
  value: string;
  onChange: (gatewayId: string) => void;
  className?: string;
}

export function PaymentMethodSelector({
  value,
  onChange,
  className,
}: PaymentMethodSelectorProps) {
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGateways = async () => {
      try {
        const res = await fetch("/api/payment/gateways");
        const data = await res.json();

        if (data.success && data.gateways.length > 0) {
          setGateways(data.gateways);
          // Set default if no value selected
          if (!value) {
            onChange(data.defaultGateway);
          }
        }
      } catch (err) {
        console.error("Failed to fetch gateways:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGateways();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        <span>بارگذاری درگاه‌ها...</span>
      </div>
    );
  }

  if (gateways.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">درگاه پرداختی موجود نیست</p>
    );
  }

  // If only one gateway, show it as a simple label (no radio needed)
  if (gateways.length === 1) {
    const gw = gateways[0];
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
          <CreditCard className="size-4 text-foreground/80" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{gw.name}</p>
          {/* <p className="text-xs text-muted-foreground">درگاه پرداخت آنلاین</p> */}
        </div>
      </div>
    );
  }

  return (
    <RadioGroup
      value={value}
      onValueChange={onChange}
      className={cn("grid gap-3", className)}
    >
      {gateways.map((gw) => (
        <label
          key={gw.id}
          dir="rtl"
          className={cn(
            "flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors",
            value === gw.id
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/30",
          )}
          htmlFor={`gateway-${gw.id}`}
        >
          <RadioGroupItem
            value={gw.id}
            id={`gateway-${gw.id}`}
            className="sr-only"
          />
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
            <CreditCard className="size-4 text-foreground/80" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">{gw.name}</p>
            {/* <p className="text-xs text-muted-foreground">درگاه پرداخت آنلاین</p> */}
          </div>
          <span
            className={cn(
              "size-4 rounded-full border-2 transition-colors",
              value === gw.id ? "border-primary" : "border-muted-foreground/30",
            )}
          >
            {value === gw.id && (
              <span className="block size-full rounded-full bg-primary" />
            )}
          </span>
        </label>
      ))}
    </RadioGroup>
  );
}
