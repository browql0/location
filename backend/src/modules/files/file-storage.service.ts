import { randomBytes } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { Readable } from "node:stream";
import path from "node:path";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../../config/env.js";
import { AppError } from "../../shared/errors/app-error.js";

export type StoredFile = {
  storageKey: string;
  fileUrl: string | null;
};

export type SaveFileOptions = {
  agencyId: string;
  clientId?: string;
  carId?: string;
  file: Express.Multer.File;
};

export interface FileStorageProvider {
  saveFile(file: Express.Multer.File, options: Omit<SaveFileOptions, "file">): Promise<StoredFile>;
  deleteFile(storageKey: string): Promise<void>;
  getSignedDownloadUrl(storageKey: string): Promise<string>;
  getFileStream(storageKey: string): Promise<Readable>;
}

const allowedExtensions = new Set([".pdf", ".png", ".jpg", ".jpeg"]);
const backendRoot = path.basename(process.cwd()) === "backend" ? process.cwd() : path.resolve(process.cwd(), "backend");
const clientsUploadRoot = path.resolve(backendRoot, "uploads");

function extensionFor(originalName: string) {
  return path.extname(originalName).toLowerCase();
}

function storageKeyFor(options: Omit<SaveFileOptions, "file">, originalName: string) {
  const ext = extensionFor(originalName);
  const entity = options.carId ? { folder: "cars", id: options.carId } : { folder: "clients", id: options.clientId };
  if (!entity.id) throw new AppError("Storage entity id is required", 400, "STORAGE_ENTITY_REQUIRED");
  return `${entity.folder}/${options.agencyId}/${entity.id}/${Date.now()}-${randomBytes(8).toString("hex")}${ext}`;
}

function assertSafeStorageKey(storageKey: string) {
  if (storageKey.includes("..") || path.isAbsolute(storageKey) || (!storageKey.startsWith("clients/") && !storageKey.startsWith("cars/"))) {
    throw new AppError("Invalid storage key", 400, "INVALID_STORAGE_KEY");
  }
}

function publicUrlFor(storageKey: string) {
  if (!env.R2_PUBLIC_URL) return null;
  return `${env.R2_PUBLIC_URL.replace(/\/$/, "")}/${storageKey}`;
}

class LocalStorageProvider implements FileStorageProvider {
  async saveFile(file: Express.Multer.File, options: Omit<SaveFileOptions, "file">) {
    const storageKey = storageKeyFor(options, file.originalname);
    const filePath = this.resolveLocalPath(storageKey);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, file.buffer);
    return { storageKey, fileUrl: null };
  }

  async deleteFile(storageKey: string) {
    await unlink(this.resolveLocalPath(storageKey));
  }

  async getSignedDownloadUrl(_storageKey: string): Promise<string> {
    throw new AppError("Signed URLs are not supported for local storage", 501, "SIGNED_URL_UNSUPPORTED");
  }

  async getFileStream(storageKey: string) {
    return createReadStream(this.resolveLocalPath(storageKey));
  }

  private resolveLocalPath(storageKey: string) {
    assertSafeStorageKey(storageKey);
    const filePath = path.resolve(clientsUploadRoot, storageKey);
    if (!filePath.startsWith(`${clientsUploadRoot}${path.sep}`)) {
      throw new AppError("Invalid storage key", 400, "INVALID_STORAGE_KEY");
    }
    return filePath;
  }
}

class R2StorageProvider implements FileStorageProvider {
  private readonly client: S3Client;

  constructor() {
    const endpoint = env.R2_ENDPOINT || (env.R2_ACCOUNT_ID ? `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : "");
    if (!endpoint || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_BUCKET_NAME) {
      throw new AppError("Cloudflare R2 configuration is incomplete", 500, "R2_CONFIG_INCOMPLETE");
    }
    this.client = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY
      }
    });
  }

  async saveFile(file: Express.Multer.File, options: Omit<SaveFileOptions, "file">) {
    const storageKey = storageKeyFor(options, file.originalname);
    await this.client.send(
      new PutObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: storageKey,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentLength: file.size
      })
    );
    return { storageKey, fileUrl: publicUrlFor(storageKey) };
  }

  async deleteFile(storageKey: string) {
    assertSafeStorageKey(storageKey);
    await this.client.send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: storageKey }));
  }

  async getSignedDownloadUrl(storageKey: string) {
    assertSafeStorageKey(storageKey);
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: storageKey }), { expiresIn: 60 * 5 });
  }

  async getFileStream(storageKey: string) {
    assertSafeStorageKey(storageKey);
    const response = await this.client.send(new GetObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: storageKey }));
    if (!(response.Body instanceof Readable)) {
      throw new AppError("Stored file is not readable", 500, "FILE_STREAM_UNAVAILABLE");
    }
    return response.Body;
  }
}

function createProvider(): FileStorageProvider {
  return env.FILE_STORAGE_DRIVER === "r2" ? new R2StorageProvider() : new LocalStorageProvider();
}

export const FileStorageService: FileStorageProvider = {
  saveFile(file, options) {
    return createProvider().saveFile(file, options);
  },
  deleteFile(storageKey) {
    return createProvider().deleteFile(storageKey);
  },
  getSignedDownloadUrl(storageKey) {
    return createProvider().getSignedDownloadUrl(storageKey);
  },
  getFileStream(storageKey) {
    return createProvider().getFileStream(storageKey);
  }
};

export function isAllowedClientDocumentFile(file: Pick<Express.Multer.File, "mimetype" | "originalname">) {
  const allowedMimeTypes = new Set(["application/pdf", "image/png", "image/jpeg", "image/jpg"]);
  const ext = extensionFor(file.originalname);
  if (!file.mimetype || !allowedMimeTypes.has(file.mimetype)) return false;
  if (!allowedExtensions.has(ext)) return false;
  if (file.mimetype === "application/pdf") return ext === ".pdf";
  if (file.mimetype === "image/png") return ext === ".png";
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/jpg") return ext === ".jpg" || ext === ".jpeg";
  return false;
}

export function isAllowedCarPhotoFile(file: Pick<Express.Multer.File, "mimetype" | "originalname">) {
  const allowedMimeTypes = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);
  const ext = extensionFor(file.originalname);
  if (!file.mimetype || !allowedMimeTypes.has(file.mimetype)) return false;
  if (![".png", ".jpg", ".jpeg", ".webp"].includes(ext)) return false;
  if (file.mimetype === "image/png") return ext === ".png";
  if (file.mimetype === "image/webp") return ext === ".webp";
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/jpg") return ext === ".jpg" || ext === ".jpeg";
  return false;
}
