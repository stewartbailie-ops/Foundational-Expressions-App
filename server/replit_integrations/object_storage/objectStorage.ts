import { Storage } from "@google-cloud/storage";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

// Server-side client for Replit Object Storage. Authenticates via the
// Replit sidecar so no static credentials are required.
export const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

export class ObjectNotFoundError extends Error {
  constructor(message = "Object not found") {
    super(message);
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

function parseObjectPath(fullPath: string): { bucketName: string; objectName: string } {
  const p = fullPath.startsWith("/") ? fullPath : `/${fullPath}`;
  const parts = p.split("/").filter(Boolean);
  if (parts.length < 2) throw new Error(`Invalid object path: ${fullPath}`);
  return { bucketName: parts[0], objectName: parts.slice(1).join("/") };
}

function publicRoot(): string {
  const raw = (process.env.PUBLIC_OBJECT_SEARCH_PATHS || "").split(",").map(s => s.trim()).filter(Boolean);
  if (raw.length === 0) throw new Error("PUBLIC_OBJECT_SEARCH_PATHS not set");
  return raw[0];
}

function privateRoot(): string {
  const r = process.env.PRIVATE_OBJECT_DIR;
  if (!r) throw new Error("PRIVATE_OBJECT_DIR not set");
  return r;
}

// Minimal server-side surface used by our upload handlers.
// We intentionally do NOT expose presigned URLs or ACL machinery — every
// upload is server-mediated (multer → encrypt/process → put), and reads are
// either streamed through an authenticated handler (client documents) or via
// the public profile-pic handler.
export class ObjectStorageService {
  // Public assets: stored under PUBLIC root, served via /uploads/* handler.
  async putPublic(key: string, body: Buffer, contentType: string): Promise<void> {
    const { bucketName, objectName } = parseObjectPath(`${publicRoot()}/${key}`);
    await objectStorageClient.bucket(bucketName).file(objectName).save(body, {
      contentType,
      resumable: false,
      metadata: { cacheControl: "public, max-age=31536000, immutable" },
    });
  }

  async getPublicStream(key: string) {
    const { bucketName, objectName } = parseObjectPath(`${publicRoot()}/${key}`);
    const file = objectStorageClient.bucket(bucketName).file(objectName);
    const [exists] = await file.exists();
    if (!exists) throw new ObjectNotFoundError(key);
    const [metadata] = await file.getMetadata();
    return { stream: file.createReadStream(), metadata };
  }

  // Private (encrypted) blobs: client documents. Bytes round-trip as-is —
  // encryption envelope is applied by the caller before put / after get.
  async putPrivate(key: string, body: Buffer): Promise<void> {
    const { bucketName, objectName } = parseObjectPath(`${privateRoot()}/${key}`);
    await objectStorageClient.bucket(bucketName).file(objectName).save(body, {
      resumable: false,
      contentType: "application/octet-stream",
    });
  }

  async getPrivate(key: string): Promise<Buffer> {
    const { bucketName, objectName } = parseObjectPath(`${privateRoot()}/${key}`);
    const file = objectStorageClient.bucket(bucketName).file(objectName);
    const [exists] = await file.exists();
    if (!exists) throw new ObjectNotFoundError(key);
    const [buf] = await file.download();
    return buf;
  }

  async deletePrivate(key: string): Promise<void> {
    const { bucketName, objectName } = parseObjectPath(`${privateRoot()}/${key}`);
    try {
      await objectStorageClient.bucket(bucketName).file(objectName).delete({ ignoreNotFound: true } as any);
    } catch (err: any) {
      if (err?.code === 404) return;
      throw err;
    }
  }
}

export const objectStorage = new ObjectStorageService();
