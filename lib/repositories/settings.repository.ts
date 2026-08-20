import { sql } from "@/lib/db/pool";
import type { Settings } from "@/lib/types/database";

// ---------------------------------------------------------------------------
// SettingsRepository — single-row app config queries
// ---------------------------------------------------------------------------

export const SettingsRepository = {
  /**
   * Get the app settings (single row, id = 1).
   */
  async get(): Promise<Settings | null> {
    const rows = await sql<Settings[]>`
      SELECT * FROM settings WHERE id = 1 LIMIT 1
    `;
    return rows[0] ?? null;
  },

  /**
   * Update the app settings (admin).
   */
  async update(data: Partial<{
    post_price: number;
    top_banner: string;
    show_phonecase: boolean;
    show_poster: boolean;
  }>): Promise<Settings | null> {
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

    if (sets.length === 0) {
      return SettingsRepository.get();
    }

    const query = `UPDATE settings SET ${sets.join(", ")} WHERE id = 1 RETURNING *`;
    const rows = (await sql.unsafe(query, values)) as Settings[];
    return rows[0] ?? null;
  },
};
