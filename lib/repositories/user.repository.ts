import { sql } from "@/lib/db/pool";
import type { Profile } from "@/lib/types/database";

// ---------------------------------------------------------------------------
// UserRepository — user/profile database queries
// ---------------------------------------------------------------------------

export const UserRepository = {
  /**
   * Get a user profile by id.
   */
  async getById(id: string): Promise<Profile | null> {
    const rows = await sql<Profile[]>`
      SELECT * FROM profiles WHERE id = ${id} LIMIT 1
    `;
    return rows[0] ?? null;
  },

  /**
   * Get a user profile by phone number.
   */
  async getByPhone(phone: string): Promise<Profile | null> {
    const rows = await sql<Profile[]>`
      SELECT * FROM profiles WHERE phone_number = ${phone} LIMIT 1
    `;
    return rows[0] ?? null;
  },

  /**
   * Create a user profile (called during signup, after Better Auth creates
   * the user in the auth schema).
   */
  async create(data: {
    id: string;
    display_name?: string;
    phone_number: string;
  }): Promise<Profile> {
    const rows = await sql<Profile[]>`
      INSERT INTO profiles (id, display_name, phone_number)
      VALUES (${data.id}, ${data.display_name ?? null}, ${data.phone_number})
      ON CONFLICT (id) DO NOTHING
      RETURNING *
    `;
    return rows[0];
  },

  /**
   * Update a user profile.
   */
  async update(
    id: string,
    data: Partial<{
      display_name: string;
      phone_number: string;
      address: string;
      city: string;
      postal_code: string;
      telegram: string;
    }>,
  ): Promise<Profile | null> {
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
    const query = `UPDATE profiles SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`;
    values.push(id);

    const rows = (await sql.unsafe(query, values)) as Profile[];
    return rows[0] ?? null;
  },

  /**
   * Delete a user profile.
   */
  async delete(id: string): Promise<boolean> {
    const result = await sql`DELETE FROM profiles WHERE id = ${id}`;
    return (result.count ?? 0) > 0;
  },
};
