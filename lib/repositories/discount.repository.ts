import { sql } from "@/lib/db/pool";
import type { Discount, DiscountUsage, DiscountUsageStats } from "@/lib/types/database";

// ---------------------------------------------------------------------------
// DiscountRepository — discount code database queries
// ---------------------------------------------------------------------------

export const DiscountRepository = {
  /**
   * Get a discount by code (for validation).
   */
  async getByCode(code: string): Promise<Discount | null> {
    const rows = await sql<Discount[]>`
      SELECT * FROM discounts WHERE code = ${code} LIMIT 1
    `;
    return rows[0] ?? null;
  },

  /**
   * Get a discount by id.
   */
  async getById(id: string): Promise<Discount | null> {
    const rows = await sql<Discount[]>`
      SELECT * FROM discounts WHERE id = ${id} LIMIT 1
    `;
    return rows[0] ?? null;
  },

  /**
   * Get all active discounts (admin management).
   */
  async getAll(): Promise<Discount[]> {
    return sql<Discount[]>`
      SELECT * FROM discounts ORDER BY created_at DESC
    `;
  },

  /**
   * Count usages of a discount by a specific user.
   */
  async countUserUsages(discountId: string, userId: string): Promise<number> {
    const rows = await sql<[{ count: number }]>`
      SELECT count(*) as count FROM discount_usages
      WHERE discount_id = ${discountId} AND user_id = ${userId}
    `;
    return Number(rows[0]?.count ?? 0);
  },

  /**
   * Count total usages of a discount.
   */
  async countTotalUsages(discountId: string): Promise<number> {
    const rows = await sql<[{ count: number }]>`
      SELECT count(*) as count FROM discount_usages
      WHERE discount_id = ${discountId}
    `;
    return Number(rows[0]?.count ?? 0);
  },

  /**
   * Record a discount usage (called when an order is placed).
   */
  async recordUsage(
    discountId: string,
    userId: string,
    orderId: string,
  ): Promise<DiscountUsage> {
    const rows = await sql<DiscountUsage[]>`
      INSERT INTO discount_usages (discount_id, user_id, order_id)
      VALUES (${discountId}, ${userId}, ${orderId})
      RETURNING *
    `;
    return rows[0];
  },

  /**
   * Get discount usage stats (admin view).
   */
  async getStats(): Promise<DiscountUsageStats[]> {
    return sql<DiscountUsageStats[]>`
      SELECT * FROM discount_usage_stats
    `;
  },

  /**
   * Create a discount (admin).
   */
  async create(data: {
    code: string;
    type: "percentage" | "fixed" | "free_shipping";
    value?: number;
    max_discount_amount?: number;
    min_order_amount?: number;
    starts_at?: string;
    expires_at?: string;
    usage_limit?: number;
    usage_per_user?: number;
    is_active?: boolean;
  }): Promise<Discount> {
    const rows = await sql<Discount[]>`
      INSERT INTO discounts (
        code, type, value, max_discount_amount, min_order_amount,
        starts_at, expires_at, usage_limit, usage_per_user, is_active
      ) VALUES (
        ${data.code}, ${data.type}, ${data.value ?? null},
        ${data.max_discount_amount ?? null}, ${data.min_order_amount ?? null},
        ${data.starts_at ?? null}, ${data.expires_at ?? null},
        ${data.usage_limit ?? null}, ${data.usage_per_user ?? null},
        ${data.is_active ?? true}
      )
      RETURNING *
    `;
    return rows[0];
  },

  /**
   * Update a discount (admin).
   */
  async update(
    id: string,
    data: Partial<{
      code: string;
      type: "percentage" | "fixed" | "free_shipping";
      value: number;
      max_discount_amount: number;
      min_order_amount: number;
      starts_at: string;
      expires_at: string;
      usage_limit: number;
      usage_per_user: number;
      is_active: boolean;
    }>,
  ): Promise<Discount | null> {
    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) {
        sets.push(`${key} = $${idx}`);
        values.push(val);
        idx++;
      }
    }

    if (sets.length === 0) return null;
    const query = `UPDATE discounts SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`;
    values.push(id);

    const rows = (await sql.unsafe(query, values)) as Discount[];
    return rows[0] ?? null;
  },

  /**
   * Delete a discount (admin).
   */
  async delete(id: string): Promise<boolean> {
    const result = await sql`DELETE FROM discounts WHERE id = ${id}`;
    return (result.count ?? 0) > 0;
  },
};
