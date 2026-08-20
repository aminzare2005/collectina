import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import type { StorageProvider } from "./types";

/**
 * S3-compatible storage provider.
 *
 * Works with:
 * - MinIO (self-hosted, Iran-friendly)
 * - ArvanCloud Objects (Iranian managed S3)
 * - AWS S3
 * - Any S3-compatible service
 *
 * Configuration via env vars:
 *   S3_ENDPOINT   — e.g. "https://s3.ir-thr-at1.arvancloud.ir" or "http://localhost:9000"
 *   S3_BUCKET     — the single bucket name (e.g. "collectina")
 *   S3_ACCESS_KEY
 *   S3_SECRET_KEY
 *   S3_REGION     — e.g. "default" for ArvanCloud, "us-east-1" for MinIO
 *   S3_PUBLIC_URL — public base URL for serving objects (e.g. CDN URL)
 *                   if not set, defaults to endpoint/bucket
 */
export class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private publicBaseUrl: string;

  constructor() {
    const endpoint = process.env.S3_ENDPOINT;
    const region = process.env.S3_REGION ?? "default";
    const accessKeyId = process.env.S3_ACCESS_KEY;
    const secretAccessKey = process.env.S3_SECRET_KEY;
    const bucket = process.env.S3_BUCKET;

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
      throw new Error(
        "S3 storage requires S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, and S3_SECRET_KEY env vars.",
      );
    }

    this.bucket = bucket;
    this.client = new S3Client({
      endpoint,
      region,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true, // required for MinIO and many S3-compatible services
    });

    // Public URL base: prefer explicit S3_PUBLIC_URL, else build from endpoint
    this.publicBaseUrl = process.env.S3_PUBLIC_URL ?? `${endpoint}/${bucket}`;
  }

  async upload(path: string, data: Buffer, contentType: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: path,
        Body: data,
        ContentType: contentType,
      }),
    );

    return this.getUrl(path);
  }

  getUrl(path: string): string {
    return `${this.publicBaseUrl}/${path}`;
  }

  async remove(path: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: path,
      }),
    );
  }

  async list(prefix?: string): Promise<string[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix,
    });

    const response = await this.client.send(command);
    return (response.Contents ?? []).map((obj) => obj.Key ?? "").filter(Boolean);
  }
}
