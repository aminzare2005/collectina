import { sql } from "@/lib/db/pool";
import type { PhoneCase, Poster } from "@/lib/types/database";

// ---------------------------------------------------------------------------
// VariantRepository — phone case and poster variant queries
// ---------------------------------------------------------------------------

export const VariantRepository = {
  // ---- Phone Cases ----

  async getPhoneCaseById(id: string): Promise<PhoneCase | null> {
    const rows = await sql<PhoneCase[]>`
      SELECT * FROM phone_cases WHERE id = ${id} LIMIT 1
    `;
    return rows[0] ?? null;
  },

  async getPhoneCaseByBrandModel(brand: string, model: string): Promise<PhoneCase | null> {
    const rows = await sql<PhoneCase[]>`
      SELECT * FROM phone_cases WHERE brand = ${brand} AND model = ${model} LIMIT 1
    `;
    return rows[0] ?? null;
  },

  async getAllPhoneCases(): Promise<PhoneCase[]> {
    return sql<PhoneCase[]>`
      SELECT * FROM phone_cases ORDER BY brand, model
    `;
  },

  async getPhoneCaseBrands(): Promise<string[]> {
    const rows = await sql<[{ brand: string }]>`
      SELECT DISTINCT brand FROM phone_cases ORDER BY brand
    `;
    return rows.map((r) => r.brand);
  },

  async getPhoneCaseModelsByBrand(brand: string): Promise<PhoneCase[]> {
    return sql<PhoneCase[]>`
      SELECT * FROM phone_cases WHERE brand = ${brand} ORDER BY model
    `;
  },

  async createPhoneCase(data: {
    brand: string;
    model: string;
    price: number;
    available?: boolean;
  }): Promise<PhoneCase> {
    const rows = await sql<PhoneCase[]>`
      INSERT INTO phone_cases (brand, model, price, available)
      VALUES (${data.brand}, ${data.model}, ${data.price}, ${data.available ?? false})
      RETURNING *
    `;
    return rows[0];
  },

  async updatePhoneCase(
    id: string,
    data: Partial<{ brand: string; model: string; price: number; available: boolean }>,
  ): Promise<PhoneCase | null> {
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
    const query = `UPDATE phone_cases SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`;
    values.push(id);

    const rows = (await sql.unsafe(query, values)) as PhoneCase[];
    return rows[0] ?? null;
  },

  async deletePhoneCase(id: string): Promise<boolean> {
    const result = await sql`DELETE FROM phone_cases WHERE id = ${id}`;
    return (result.count ?? 0) > 0;
  },

  async countPhoneCases(): Promise<number> {
    const rows = await sql<[{ count: number }]>`
      SELECT count(*) as count FROM phone_cases
    `;
    return Number(rows[0]?.count ?? 0);
  },

  // ---- Posters ----

  async getPosterById(id: string): Promise<Poster | null> {
    const rows = await sql<Poster[]>`
      SELECT * FROM posters WHERE id = ${id} LIMIT 1
    `;
    return rows[0] ?? null;
  },

  async getAllPosters(): Promise<Poster[]> {
    return sql<Poster[]>`
      SELECT * FROM posters ORDER BY created_at DESC
    `;
  },

  async createPoster(data: {
    attribute?: string;
    price: string;
    available: boolean;
  }): Promise<Poster> {
    const rows = await sql<Poster[]>`
      INSERT INTO posters (attribute, price, available)
      VALUES (${data.attribute ?? null}, ${data.price}, ${data.available})
      RETURNING *
    `;
    return rows[0];
  },

  async updatePoster(
    id: string,
    data: Partial<{ attribute: string; price: string; available: boolean }>,
  ): Promise<Poster | null> {
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
    const query = `UPDATE posters SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`;
    values.push(id);

    const rows = (await sql.unsafe(query, values)) as Poster[];
    return rows[0] ?? null;
  },

  async deletePoster(id: string): Promise<boolean> {
    const result = await sql`DELETE FROM posters WHERE id = ${id}`;
    return (result.count ?? 0) > 0;
  },

  async countPosters(): Promise<number> {
    const rows = await sql<[{ count: number }]>`
      SELECT count(*) as count FROM posters
    `;
    return Number(rows[0]?.count ?? 0);
  },
};
