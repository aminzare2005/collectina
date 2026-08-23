import { sql } from "@/lib/db/pool";
import type { Order, OrderItem, OrderWithItems } from "@/lib/types/database";

// ---------------------------------------------------------------------------
// OrderRepository — order + order_items database queries
// ---------------------------------------------------------------------------

export const OrderRepository = {
  /**
   * Get a single order by id.
   */
  async getById(id: string): Promise<Order | null> {
    const rows = await sql<Order[]>`
      SELECT * FROM orders WHERE id = ${id} LIMIT 1
    `;
    return rows[0] ?? null;
  },

  /**
   * Get an order by its user-facing track_id (public tracking page).
   * Returns ONLY the fields needed for tracking — not the full order.
   */
  async getTrackingByTrackId(trackId: number): Promise<{
    id: string;
    status: string;
    track_id: number;
    track_post_id: string | null;
    total_amount: number | string;
    created_at: string;
    updated_at: string;
    order_items: (OrderItem & {
      products: { image_url: string | null; type: string | null } | null;
    })[];
  } | null> {
    const rows = await sql<
      {
        id: string;
        status: string;
        track_id: number;
        track_post_id: string | null;
        total_amount: number | string;
        created_at: string;
        updated_at: string;
        order_items: (OrderItem & {
          products: { image_url: string | null; type: string | null } | null;
        })[];
      }[]
    >`
      SELECT
        o.id, o.status, o.track_id, o.track_post_id,
        o.total_amount, o.created_at, o.updated_at,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', oi.id,
            'order_id', oi.order_id,
            'product_id', oi.product_id,
            'product_name', oi.product_name,
            'product_price', oi.product_price,
            'quantity', oi.quantity,
            'created_at', oi.created_at,
            'phone_case_id', oi.phone_case_id,
            'phone_brand', oi.phone_brand,
            'phone_model', oi.phone_model,
            'poster_atr', oi.poster_atr,
            'poster_id', oi.poster_id,
            'products', json_build_object(
              'image_url', p.image_url,
              'type', p.type
            )
          ))
           FROM order_items oi
           LEFT JOIN products p ON p.id = oi.product_id
           WHERE oi.order_id = o.id),
          '[]'::json
        ) AS order_items
      FROM orders o
      WHERE o.track_id = ${trackId}
      LIMIT 1
    `;
    return rows[0] ?? null;
  },

  /**
   * Get all orders for a user (dashboard order list).
   */
  async getByUserId(userId: string): Promise<Order[]> {
    return sql<Order[]>`
      SELECT * FROM orders
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;
  },

  /**
   * Get order with items (for order-success, order-failed, admin detail).
   */
  async getByIdWithItems(id: string): Promise<OrderWithItems | null> {
    const rows = await sql<OrderWithItems[]>`
      SELECT
        o.*,
        COALESCE(
          (SELECT json_agg(oi.*)
           FROM order_items oi
           WHERE oi.order_id = o.id),
          '[]'::json
        ) AS order_items
      FROM orders o
      WHERE o.id = ${id}
      LIMIT 1
    `;
    return rows[0] ?? null;
  },

  /**
   * Get all orders with items (admin page).
   * Includes product image_url + type via LEFT JOIN on products.
   */
  async getAllWithItems(limit = 50, offset = 0): Promise<
    (OrderWithItems & {
      order_items: (OrderItem & {
        products: { image_url: string | null; type: string | null } | null;
      })[];
    })[]
  > {
    return sql<
      (OrderWithItems & {
        order_items: (OrderItem & {
          products: { image_url: string | null; type: string | null } | null;
        })[];
      })[]
    >`
      SELECT
        o.*,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', oi.id,
            'order_id', oi.order_id,
            'product_id', oi.product_id,
            'product_name', oi.product_name,
            'product_price', oi.product_price,
            'quantity', oi.quantity,
            'created_at', oi.created_at,
            'phone_case_id', oi.phone_case_id,
            'phone_brand', oi.phone_brand,
            'phone_model', oi.phone_model,
            'poster_atr', oi.poster_atr,
            'poster_id', oi.poster_id,
            'products', json_build_object(
              'image_url', p.image_url,
              'type', p.type
            )
          ))
           FROM order_items oi
           LEFT JOIN products p ON p.id = oi.product_id
           WHERE oi.order_id = o.id),
          '[]'::json
        ) AS order_items
      FROM orders o
      ORDER BY o.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  },

  /**
   * Create an order (called from checkout service).
   */
  async create(data: {
    user_id: string;
    total_amount: number;
    status?: string;
    shipping_address: string;
    shipping_city: string;
    shipping_postal_code: string;
    phone_number: string;
    telegram?: string;
    receiver_name?: string;
    discount_id?: string;
    discount_amount?: number;
    free_shipping?: boolean;
    note?: string;
  }): Promise<Order> {
    const rows = await sql<Order[]>`
      INSERT INTO orders (
        user_id, total_amount, status, shipping_address, shipping_city,
        shipping_postal_code, phone_number, telegram, receiver_name,
        discount_id, discount_amount, free_shipping, note
      ) VALUES (
        ${data.user_id}, ${data.total_amount}, ${data.status ?? "pending"},
        ${data.shipping_address}, ${data.shipping_city}, ${data.shipping_postal_code},
        ${data.phone_number}, ${data.telegram ?? null}, ${data.receiver_name ?? null},
        ${data.discount_id ?? null}, ${data.discount_amount ?? 0},
        ${data.free_shipping ?? false}, ${data.note ?? null}
      )
      RETURNING *
    `;
    return rows[0];
  },

  /**
   * Update an order's status (admin or payment verify).
   */
  async updateStatus(id: string, status: string): Promise<Order | null> {
    const rows = await sql<Order[]>`
      UPDATE orders SET status = ${status}, updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `;
    return rows[0] ?? null;
  },

  /**
   * Update an order's payment reference (Zibal trackId).
   */
  async updatePaymentReference(id: string, paymentReference: string): Promise<Order | null> {
    const rows = await sql<Order[]>`
      UPDATE orders SET payment_reference = ${paymentReference}, updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `;
    return rows[0] ?? null;
  },

  /**
   * Update order's Iran Post tracking code (admin).
   */
  async updateTrackPostId(id: string, trackPostId: string): Promise<Order | null> {
    const rows = await sql<Order[]>`
      UPDATE orders SET track_post_id = ${trackPostId}, updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `;
    return rows[0] ?? null;
  },

  /**
   * Count orders, optionally by status.
   */
  async count(status?: string): Promise<number> {
    if (status) {
      const rows = await sql<[{ count: number }]>`
        SELECT count(*) as count FROM orders WHERE status = ${status}
      `;
      return Number(rows[0]?.count ?? 0);
    }
    const rows = await sql<[{ count: number }]>`
      SELECT count(*) as count FROM orders
    `;
    return Number(rows[0]?.count ?? 0);
  },

  // ---- Order Items ----

  /**
   * Create order items (individual parameterized inserts).
   */
  async createItems(
    orderId: string,
    items: {
      product_id: string;
      product_name: string;
      product_price: number;
      quantity: number;
      phone_case_id?: string;
      phone_brand?: string;
      phone_model?: string;
      poster_atr?: string;
      poster_id?: string;
    }[],
  ): Promise<OrderItem[]> {
    if (items.length === 0) return [];

    const results: OrderItem[] = [];
    for (const item of items) {
      const rows = await sql<OrderItem[]>`
        INSERT INTO order_items (
          order_id, product_id, product_name, product_price, quantity,
          phone_case_id, phone_brand, phone_model, poster_atr, poster_id
        ) VALUES (
          ${orderId}::uuid, ${item.product_id}::uuid, ${item.product_name},
          ${item.product_price}, ${item.quantity},
          ${item.phone_case_id ?? null}::uuid, ${item.phone_brand ?? null},
          ${item.phone_model ?? null}, ${item.poster_atr ?? null},
          ${item.poster_id ?? null}::uuid
        )
        RETURNING *
      `;
      if (rows[0]) results.push(rows[0]);
    }
    return results;
  },

  /**
   * Get items for an order.
   */
  async getItemsByOrderId(orderId: string): Promise<OrderItem[]> {
    return sql<OrderItem[]>`
      SELECT * FROM order_items WHERE order_id = ${orderId}
    `;
  },
};
