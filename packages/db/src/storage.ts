import {
  CreateBucketCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

/** S3-compatible file storage (SeaweedFS locally, any S3 bucket in the cloud). Server only. */
export interface StorageConfig {
  endpoint?: string;
  region: string;
  bucket: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  forcePathStyle: boolean;
}

export interface Storage {
  put(key: string, body: Uint8Array, contentType: string): Promise<void>;
  get(key: string): Promise<{ body: Uint8Array; contentType: string } | null>;
  /** Delete every object under a prefix (account deletion removes `users/<id>/`). */
  deletePrefix(prefix: string): Promise<number>;
}

export function createStorage(config: StorageConfig): Storage {
  const s3 = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: config.forcePathStyle,
    credentials:
      config.accessKeyId && config.secretAccessKey
        ? { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey }
        : undefined,
  });
  const Bucket = config.bucket;
  let ready: Promise<void> | undefined;
  // Creates the bucket on first use (local SeaweedFS starts empty).
  const ensure = () =>
    (ready ??= (async () => {
      try {
        await s3.send(new HeadBucketCommand({ Bucket }));
      } catch {
        await s3.send(new CreateBucketCommand({ Bucket }));
      }
    })().catch((err: unknown) => {
      ready = undefined;
      throw err;
    }));

  return {
    async put(key, body, contentType) {
      await ensure();
      await s3.send(
        new PutObjectCommand({ Bucket, Key: key, Body: body, ContentType: contentType }),
      );
    },
    async get(key) {
      await ensure();
      try {
        const res = await s3.send(new GetObjectCommand({ Bucket, Key: key }));
        const body = await res.Body?.transformToByteArray();
        return body ? { body, contentType: res.ContentType ?? "application/octet-stream" } : null;
      } catch {
        return null;
      }
    },
    async deletePrefix(prefix) {
      await ensure();
      let deleted = 0;
      let token: string | undefined;
      do {
        const page = await s3.send(
          new ListObjectsV2Command({ Bucket, Prefix: prefix, ContinuationToken: token }),
        );
        const keys = (page.Contents ?? []).flatMap((o) => (o.Key ? [{ Key: o.Key }] : []));
        if (keys.length) {
          await s3.send(new DeleteObjectsCommand({ Bucket, Delete: { Objects: keys } }));
          deleted += keys.length;
        }
        token = page.IsTruncated ? page.NextContinuationToken : undefined;
      } while (token);
      return deleted;
    },
  };
}
