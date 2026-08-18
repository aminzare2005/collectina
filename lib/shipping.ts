export type ShippableProductType = "phonecase" | "poster";

/** هر گروه = یک مرسوله و یک بار هزینه post_price */
export type ShippingGroupId = "phonecase" | "poster";

/**
 * نگاشت تایپ محصول → گروه ارسال.
 * تایپ جدید (مثلاً tshirt) را اینجا به گروه موجود یا گروه جدید وصل کن.
 */
export const SHIPPING_GROUP_BY_PRODUCT_TYPE: Record<
  ShippableProductType,
  ShippingGroupId
> = {
  poster: "poster",
  phonecase: "phonecase",
};

export const SHIPPING_GROUP_LABELS: Record<ShippingGroupId, string> = {
  poster: "پوستر",
  phonecase: "قاب موبایل",
};

const SHIPPING_GROUP_ORDER: ShippingGroupId[] = ["poster", "phonecase"];

export function getDistinctShippingGroups(
  productTypes: ShippableProductType[],
): ShippingGroupId[] {
  const set = new Set<ShippingGroupId>();
  for (const type of productTypes) {
    const group = SHIPPING_GROUP_BY_PRODUCT_TYPE[type];
    if (group) set.add(group);
  }
  return SHIPPING_GROUP_ORDER.filter((g) => set.has(g));
}

export function calculateCartShipping(params: {
  postPricePerShipment: number;
  productTypes: ShippableProductType[];
  freeShipping: boolean;
}): {
  total: number;
  shipmentCount: number;
  groups: { id: ShippingGroupId; label: string; fee: number }[];
} {
  const groupIds = getDistinctShippingGroups(params.productTypes);
  const feePer = params.freeShipping ? 0 : params.postPricePerShipment;

  const groups = groupIds.map((id) => ({
    id,
    label: SHIPPING_GROUP_LABELS[id],
    fee: feePer,
  }));

  return {
    total: feePer * groups.length,
    shipmentCount: groups.length,
    groups,
  };
}
