import type { StorageProvider } from "./types";

/**
 * Supabase Storage provider (transitional).
 *
 * This is a thin wrapper around the Supabase Storage REST API.
 * It exists only during the migration period to allow dual-operation.
 * It will be deleted once the S3 provider is confirmed working in production.
 *
 * The bucket is configured via NEXT_PUBLIC_SUPABASE_BUCKET env var
 * (defaults to "collectina").
 */
export class SupabaseStorageProvider implements StorageProvider {
  private supabaseUrl: string;
  private supabaseKey: string;
  private bucket: string;

  constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    this.supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
    this.bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET ?? "collectina";
  }

  async upload(path: string, data: Buffer, contentType: string): Promise<string> {
    const url = `${this.supabaseUrl}/storage/v1/object/${this.bucket}/${path}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": contentType,
        apikey: this.supabaseKey,
        Authorization: `Bearer ${this.supabaseKey}`,
      },
      body: data,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Supabase Storage upload failed: ${error}`);
    }

    return this.getUrl(path);
  }

  getUrl(path: string): string {
    return `${this.supabaseUrl}/storage/v1/object/public/${this.bucket}/${path}`;
  }

  async remove(path: string): Promise<void> {
    const url = `${this.supabaseUrl}/storage/v1/object/${this.bucket}/${path}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        apikey: this.supabaseKey,
        Authorization: `Bearer ${this.supabaseKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Supabase Storage delete failed: ${error}`);
    }
  }

  async list(prefix?: string): Promise<string[]> {
    const url = `${this.supabaseUrl}/storage/v1/object/list/${this.bucket}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: this.supabaseKey,
        Authorization: `Bearer ${this.supabaseKey}`,
      },
      body: JSON.stringify({
        prefix: prefix ?? "",
        limit: 1000,
        offset: 0,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Supabase Storage list failed: ${error}`);
    }

    const data = await response.json();
    return (data ?? []).map((obj: { name: string }) => obj.name);
  }
}
