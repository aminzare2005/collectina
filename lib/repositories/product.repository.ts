import { sql } from "@/lib/db/pool";
import type { Product, PhoneCase, Poster } from "@/lib/types/database";

// ---------------------------------------------------------------------------
// ProductRepository — all product-related database queries
// ---------------------------------------------------------------------------

export const ProductRepository = {
  /**
   * Get a single product by id + type.
   */
  async getById(id: string, type: "phonecase" | "poster"): Promise<Product | null> {
    const rows = await sql<Product[]>`
      SELECT * FROM products
      WHERE id = ${id} AND type = ${type}
      LIMIT 1
    `;
    return rows[0] ?? null;
  },

  /**
   * Get a single product by id (no type filter).
   */
  async getByIdAny(id: string): Promise<Product | null> {
    const rows = await sql<Product[]>`
      SELECT * FROM products WHERE id = ${id} LIMIT 1
    `;
    return rows[0] ?? null;
  },

  /**
   * Get phone case variants for a product.
   */
  async getPhoneCases(productId: string): Promise<PhoneCase[]> {
    return sql<PhoneCase[]>`
      SELECT pc.* FROM phone_cases pc
      WHERE pc.product_id = ${productId}
      ORDER BY pc.brand, pc.model
    `;
  },

  /**
   * Get poster variants for a product.
   */
  async getPosters(productId: string): Promise<Poster[]> {
    return sql<Poster[]>`
      SELECT p.* FROM posters p
      WHERE p.product_id = ${productId}
      ORDER BY p.attribute
    `;
  },

  /**
   * Get a single phone case variant by id.
   */
  async getPhoneCaseById(id: string): Promise<PhoneCase | null> {
    const rows = await sql<PhoneCase[]>`
      SELECT * FROM phone_cases WHERE id = ${id} LIMIT 1
    `;
    return rows[0] ?? null;
  },

  /**
   * Get a single poster variant by id.
   */
  async getPosterById(id: string): Promise<Poster | null> {
    const rows = await sql<Poster[]>`
      SELECT * FROM posters WHERE id = ${id} LIMIT 1
    `;
    return rows[0] ?? null;
  },

  /**
   * Get paginated product feed, ordered by pin desc then created_at desc.
   * @param type 'phonecase' | 'poster'
   * @param offset starting row
   * @param limit max rows per page
   * @param feedOnly if true, only products where feed = true
   */
  async getFeed(
    type: "phonecase" | "poster",
    offset: number,
    limit: number,
    feedOnly = true,
  ): Promise<Product[]> {
    if (feedOnly) {
      return sql<Product[]>`
        SELECT * FROM products
        WHERE type = ${type} AND feed = true
        ORDER BY pin DESC, created_at DESC
        OFFSET ${offset} LIMIT ${limit}
      `;
    }
    return sql<Product[]>`
      SELECT * FROM products
      WHERE type = ${type}
      ORDER BY pin DESC, created_at DESC
      OFFSET ${offset} LIMIT ${limit}
    `;
  },

  /**
   * Get pinned products for homepage.
   */
  async getPinned(type: "phonecase" | "poster"): Promise<Product[]> {
    return sql<Product[]>`
      SELECT * FROM products
      WHERE type = ${type} AND feed = true AND pin = true
      ORDER BY created_at DESC
      LIMIT 6
    `;
  },

  /**
   * Get recent poster products (for cart poster suggestion).
   */
  async getRecentPosters(limit = 6): Promise<Product[]> {
    return sql<Product[]>`
      SELECT * FROM products
      WHERE type = 'poster' AND feed = true
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
  },

  /**
   * Create a product (admin custom upload).
   */
  async create(product: {
    name?: string;
    description?: string;
    image_url: string;
    designer?: string;
    type?: "phonecase" | "poster";
    feed?: boolean;
    pin?: boolean;
  }): Promise<Product> {
    const rows = await sql<Product[]>`
      INSERT INTO products (name, description, image_url, designer, type, feed, pin)
      VALUES (
        ${product.name ?? null},
        ${product.description ?? null},
        ${product.image_url},
        ${product.designer ?? null},
        ${product.type ?? null},
        ${product.feed ?? true},
        ${product.pin ?? false}
      )
      RETURNING *
    `;
    return rows[0];
  },

  /**
   * Update a product (admin CRUD).
   */
  async update(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      image_url: string;
      feed: boolean;
      pin: boolean;
      type: "phonecase" | "poster";
    }>,
  ): Promise<Product | null> {
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

    sets.push(`updated_at = now()`);
    const query = `UPDATE products SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`;
    values.push(id);

    const rows = (await sql.unsafe(query, values)) as Product[];
    return rows[0] ?? null;
  },

  /**
   * Delete a product (admin CRUD).
   */
  async delete(id: string): Promise<boolean> {
    const result = await sql`DELETE FROM products WHERE id = ${id}`;
    return (result.count ?? 0) > 0;
  },

  /**
   * Count products by type.
   */
  async count(type?: "phonecase" | "poster"): Promise<number> {
    if (type) {
      const rows = await sql<[{ count: number }]>`
        SELECT count(*) as count FROM products WHERE type = ${type}
      `;
      return Number(rows[0]?.count ?? 0);
    }
    const rows = await sql<[{ count: number }]>`
      SELECT count(*) as count FROM products
    `;
    return Number(rows[0]?.count ?? 0);
  },
};
