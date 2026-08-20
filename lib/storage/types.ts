/**
 * StorageProvider — abstract interface for object storage.
 *
 * All storage operations go through this interface. The application never
 * directly touches Supabase Storage, S3, MinIO, or any other provider.
 *
 * The bucket is configured once via environment variables (S3_BUCKET or
 * equivalent). Callers don't pass bucket names.
 */
export interface StorageProvider {
  /**
   * Upload a file to storage.
   * @param path - the object key (e.g. "2026-08-20-phonecase.png")
   * @param data - the file content as a Buffer
   * @param contentType - MIME type (e.g. "image/png")
   * @returns the public URL of the uploaded object
   */
  upload(path: string, data: Buffer, contentType: string): Promise<string>;

  /**
   * Get the public URL for an object.
   * @param path - the object key
   * @returns the public URL
   */
  getUrl(path: string): string;

  /**
   * Delete an object from storage.
   * @param path - the object key
   */
  remove(path: string): Promise<void>;

  /**
   * List objects in the bucket with a prefix.
   * @param prefix - optional prefix filter
   * @returns array of object keys
   */
  list(prefix?: string): Promise<string[]>;
}
