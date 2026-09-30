import "server-only";
import { createStorage, type Storage } from "@ge/db/storage";
import { env } from "./env";

let storage: Storage | undefined;
const s = () => {
  const e = env();
  storage ??= createStorage({
    endpoint: e.S3_ENDPOINT,
    region: e.S3_REGION,
    bucket: e.S3_BUCKET,
    accessKeyId: e.S3_ACCESS_KEY_ID,
    secretAccessKey: e.S3_SECRET_ACCESS_KEY,
    forcePathStyle: e.S3_FORCE_PATH_STYLE,
  });
  return storage;
};

export const putObject = (key: string, body: Uint8Array, contentType: string) =>
  s().put(key, body, contentType);
export const getObject = (key: string) => s().get(key);
export const deletePrefix = (prefix: string) => s().deletePrefix(prefix);
