import { sql } from "@/lib/db/pool";
import type { CartItem, CartItemWithDetails } from "@/lib/types/database";

// ---------------------------------------------------------------------------
// CartRepository — shopping cart database queries
// ---------------------------------------------------------------------------

export const CartRepository = {
  /**
   * Get all cart items for a user, joined with product + variant data.
   */
  async getByUserId(userId: string): Promise<CartItemWithDetails[]> {
    return sql<CartItemWithDetails[]>`
      SELECT
        ci.*,
        row_to_json(p.*) AS product,
        row_to_json(pc.*) AS phone_case,
        row_to_json(po.*) AS poster
      FROM cart_items ci
      JOIN products p ON p.id = ci.product_id
      LEFT JOIN phone_cases pc ON pc.id = ci.phone_case_id
      LEFT JOIN posters po ON po.id = ci.poster_id
      WHERE ci.user_id = ${userId}
      ORDER BY ci.created_at DESC
    `;
  },

  /**
   * Get raw cart items for a user (no joins).
   */
  async getRawByUserId(userId: string): Promise<CartItem[]> {
    return sql<CartItem[]>`
      SELECT * FROM cart_items WHERE user_id = ${userId} ORDER BY created_at DESC
    `;
  },

  /**
   * Get a single cart item by id.
   */
  async getById(id: string): Promise<CartItem | null> {
    const rows = await sql<CartItem[]>`
      SELECT * FROM cart_items WHERE id = ${id} LIMIT 1
    `;
    return rows[0] ?? null;
  },

  /**
   * Count cart items for a user (for the header badge).
   */
  async countByUserId(userId: string): Promise<number> {
    const rows = await sql<[{ count: number }]>`
      SELECT count(*) as count FROM cart_items WHERE user_id = ${userId}
    `;
    return Number(rows[0]?.count ?? 0);
  },

  /**
   * Add an item to the cart. If the same user+product+phone_case already
   * exists, increment the quantity instead.
   */
  async addOrUpdate(userId: string, productId: string, phoneCaseId?: string, posterId?: string): Promise<CartItem> {
    // Try to find existing
    const existing = await sql<CartItem[]>`
      SELECT * FROM cart_items
      WHERE user_id = ${userId}
        AND product_id = ${productId}
        AND phone_case_id IS NOT DISTINCT FROM ${phoneCaseId ?? null}
        AND poster_id IS NOT DISTINCT FROM ${posterId ?? null}
      LIMIT 1
    `;

    if (existing[0]) {
      const rows = await sql<CartItem[]>`
        UPDATE cart_items
        SET quantity = quantity + 1, updated_at = now()
        WHERE id = ${existing[0].id}
        RETURNING *
      `;
      return rows[0];
    }

    const rows = await sql<CartItem[]>`
      INSERT INTO cart_items (user_id, product_id, phone_case_id, poster_id)
      VALUES (${userId}, ${productId}, ${phoneCaseId ?? null}, ${posterId ?? null})
      RETURNING *
    `;
    return rows[0];
  },

  /**
   * Set the quantity of a cart item. If quantity <= 0, delete it.
   */
  async setQuantity(id: string, quantity: number): Promise<CartItem | null> {
    if (quantity <= 0) {
      await sql`DELETE FROM cart_items WHERE id = ${id}`;
      return null;
    }
    const rows = await sql<CartItem[]>`
      UPDATE cart_items
      SET quantity = ${quantity}, updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `;
    return rows[0] ?? null;
  },

  /**
   * Delete a single cart item.
   */
  async delete(id: string): Promise<boolean> {
    const result = await sql`DELETE FROM cart_items WHERE id = ${id}`;
    return (result.count ?? 0) > 0;
  },

  /**
   * Delete all cart items for a user (e.g. after order is placed).
   */
  async deleteAllForUser(userId: string): Promise<number> {
    const result = await sql`DELETE FROM cart_items WHERE user_id = ${userId}`;
    return result.count ?? 0;
  },
};
