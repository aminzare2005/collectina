// ============================================================================
// collectina — Order Status constants (single source of truth)
// ============================================================================
// Every place that displays order status should import from here instead of
// maintaining its own copy of labels / styles / icons.
//
// DESIGN: Each status has ONE base Tailwind color (STATUS_COLOR_MAP).
// All derived maps (badge, icon, timeline, accent) use shades of that color.
// Changing the base color in STATUS_COLOR_MAP is the ONLY change needed to
// restyle a status across the entire app.
// ============================================================================

import {
  Clock,
  CreditCard,
  PackageSearch,
  Truck,
  CheckCircle2,
  XCircle,
  Undo2,
  RotateCcw,
  X,
  MousePointerClick,
  ShieldCheck,
  AlertTriangle,
  PackageCheck,
  type LucideIcon,
  PackageOpenIcon,
  Package,
  TruckIcon,
  TruckElectricIcon,
  CoinsIcon,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Status union type
// ---------------------------------------------------------------------------

export type OrderStatus =
  | "pending"
  | "pending_card_verification"
  | "paid"
  | "outofstock"
  | "processing"
  | "ready"
  | "part_delivered"
  | "delivered"
  | "returned"
  | "canceled"
  | "refunded";

// ---------------------------------------------------------------------------
// Base color map — ONE color per status, everything derives from here
// ---------------------------------------------------------------------------

/**
 * Base Tailwind color for each status.
 * To change a status color: update this map + the shade-100/300/500/600/700
 * entries in the derived maps below (same color, different shades).
 */
export const STATUS_COLOR_MAP: Record<OrderStatus, string> = {
  pending: "yellow",
  pending_card_verification: "amber",
  paid: "green",
  outofstock: "rose",
  processing: "blue",
  ready: "indigo",
  delivered: "emerald",
  part_delivered: "lime",
  returned: "orange",
  canceled: "gray",
  refunded: "teal",
};

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "در انتظار پرداخت",
  pending_card_verification: "در انتظار تایید پرداخت",
  paid: "پرداخت شده",
  outofstock: "اتمام موجودی",
  processing: "در حال آماده سازی",
  ready: "آماده ارسال",
  delivered: "ارسال شد",
  part_delivered: "بخشی از سفارش ارسال شده",
  returned: "مرجوع شده",
  canceled: "لغو شده",
  refunded: "لغو و بازپرداخت شده",
};

// ---------------------------------------------------------------------------
// Colors — all derived from STATUS_COLOR_MAP's base color
// badge=100/700, icon=100/600, timeline=300, accent=500/10
// ---------------------------------------------------------------------------

export const STATUS_BADGE_CLASSES: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700", // yellow
  pending_card_verification: "bg-amber-100 text-amber-700", // amber
  paid: "bg-green-100 text-green-700", // green
  outofstock: "bg-rose-100 text-rose-700", // rose
  processing: "bg-blue-100 text-blue-700", // blue
  ready: "bg-indigo-100 text-indigo-700", // indigo
  delivered: "bg-emerald-100 text-emerald-700", // emerald
  part_delivered: "bg-lime-100 text-lime-700", // lime
  returned: "bg-orange-100 text-orange-700", // orange
  canceled: "bg-gray-200 text-gray-700", // gray
  refunded: "bg-teal-100 text-teal-700", // teal
};

export const STATUS_ICON_CLASSES: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-600",
  pending_card_verification: "bg-amber-100 text-amber-600",
  paid: "bg-green-100 text-green-600",
  outofstock: "bg-rose-100 text-rose-600",
  processing: "bg-blue-100 text-blue-600",
  ready: "bg-indigo-100 text-indigo-600",
  delivered: "bg-emerald-100 text-emerald-600",
  part_delivered: "bg-lime-100 text-lime-600",
  returned: "bg-orange-100 text-orange-600",
  canceled: "bg-gray-200 text-gray-700",
  refunded: "bg-teal-100 text-teal-600",
};

export const STATUS_TIMELINE_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100",
  pending_card_verification: "bg-amber-100",
  paid: "bg-green-100",
  outofstock: "bg-rose-100",
  processing: "bg-blue-100",
  ready: "bg-indigo-100",
  delivered: "bg-emerald-100",
  part_delivered: "bg-lime-100",
  returned: "bg-orange-100",
  canceled: "bg-gray-200",
  refunded: "bg-teal-100",
};

/** Text color for each status — same -700 shade used in STATUS_BADGE_CLASSES. */
export const STATUS_TEXT_CLASSES: Record<OrderStatus, string> = {
  pending: "text-yellow-700",
  pending_card_verification: "text-amber-700",
  paid: "text-green-700",
  outofstock: "text-rose-700",
  processing: "text-blue-700",
  ready: "text-indigo-700",
  delivered: "text-emerald-700",
  part_delivered: "text-lime-700",
  returned: "text-orange-700",
  canceled: "text-gray-700",
  refunded: "text-teal-700",
};

// ---------------------------------------------------------------------------
// Icons (semantic — not color-derived)
// ---------------------------------------------------------------------------

export const STATUS_ICONS: Record<OrderStatus, LucideIcon> = {
  pending: MousePointerClick,
  pending_card_verification: Clock,
  paid: CoinsIcon,
  outofstock: AlertTriangle,
  processing: Package,
  ready: PackageCheck,
  delivered: TruckIcon,
  part_delivered: TruckElectricIcon,
  returned: PackageOpenIcon,
  canceled: XCircle,
  refunded: ShieldCheck,
};

export const STATUS_TIMELINE_ICONS: Record<OrderStatus, LucideIcon> = {
  pending: MousePointerClick,
  pending_card_verification: Clock,
  paid: CoinsIcon,
  outofstock: AlertTriangle,
  processing: Package,
  ready: PackageCheck,
  delivered: TruckIcon,
  part_delivered: TruckElectricIcon,
  returned: PackageOpenIcon,
  canceled: XCircle,
  refunded: ShieldCheck,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function toOrderStatus(
  raw: string | null | undefined,
): OrderStatus | undefined {
  if (!raw) return undefined;
  return raw in STATUS_LABELS ? (raw as OrderStatus) : undefined;
}

export function getStatusLabel(raw: string | null | undefined): string {
  const s = toOrderStatus(raw);
  return s ? STATUS_LABELS[s] : "نامشخص";
}

export function getStatusBadgeClass(raw: string | null | undefined): string {
  const s = toOrderStatus(raw);
  return s ? STATUS_BADGE_CLASSES[s] : "bg-zinc-100 text-zinc-700";
}

export function getStatusIconClass(raw: string | null | undefined): string {
  const s = toOrderStatus(raw);
  return s ? STATUS_ICON_CLASSES[s] : "bg-zinc-100 text-zinc-700";
}

export function getStatusIcon(raw: string | null | undefined): LucideIcon {
  const s = toOrderStatus(raw);
  return s ? STATUS_ICONS[s] : Clock;
}

export function getStatusTextClass(raw: string | null | undefined): string {
  const s = toOrderStatus(raw);
  return s ? STATUS_TEXT_CLASSES[s] : "text-zinc-700";
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------

export type TimelineStep = {
  key: OrderStatus;
  label: string;
  color: string;
  icon: LucideIcon;
  hide: boolean;
};

export const TIMELINE_STEPS: TimelineStep[] = [
  {
    key: "pending",
    label: STATUS_LABELS.pending,
    color: STATUS_TIMELINE_COLORS.pending,
    icon: STATUS_TIMELINE_ICONS.pending,
    hide: true,
  },
  {
    key: "pending_card_verification",
    label: STATUS_LABELS.pending_card_verification,
    color: STATUS_TIMELINE_COLORS.pending_card_verification,
    icon: STATUS_TIMELINE_ICONS.pending_card_verification,
    hide: true,
  },
  {
    key: "paid",
    label: STATUS_LABELS.paid,
    color: STATUS_TIMELINE_COLORS.paid,
    icon: STATUS_TIMELINE_ICONS.paid,
    hide: false,
  },
  {
    key: "outofstock",
    label: STATUS_LABELS.outofstock,
    color: STATUS_TIMELINE_COLORS.outofstock,
    icon: STATUS_TIMELINE_ICONS.outofstock,
    hide: true,
  },
  {
    key: "processing",
    label: STATUS_LABELS.processing,
    color: STATUS_TIMELINE_COLORS.processing,
    icon: STATUS_TIMELINE_ICONS.processing,
    hide: false,
  },
  {
    key: "ready",
    label: STATUS_LABELS.ready,
    color: STATUS_TIMELINE_COLORS.ready,
    icon: STATUS_TIMELINE_ICONS.ready,
    hide: false,
  },
  {
    key: "part_delivered",
    label: STATUS_LABELS.part_delivered,
    color: STATUS_TIMELINE_COLORS.part_delivered,
    icon: STATUS_TIMELINE_ICONS.part_delivered,
    hide: true,
  },
  {
    key: "delivered",
    label: STATUS_LABELS.delivered,
    color: STATUS_TIMELINE_COLORS.delivered,
    icon: STATUS_TIMELINE_ICONS.delivered,
    hide: false,
  },
  {
    key: "returned",
    label: STATUS_LABELS.returned,
    color: STATUS_TIMELINE_COLORS.returned,
    icon: STATUS_TIMELINE_ICONS.returned,
    hide: true,
  },
  {
    key: "canceled",
    label: STATUS_LABELS.canceled,
    color: STATUS_TIMELINE_COLORS.canceled,
    icon: STATUS_TIMELINE_ICONS.canceled,
    hide: true,
  },
  {
    key: "refunded",
    label: STATUS_LABELS.refunded,
    color: STATUS_TIMELINE_COLORS.refunded,
    icon: STATUS_TIMELINE_ICONS.refunded,
    hide: true,
  },
];
