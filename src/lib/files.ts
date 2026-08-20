import "server-only";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

export async function saveUpload(file: File) {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const ext = path.extname(file.name).slice(0, 20);
  const storedName = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, storedName), buffer);
  return {
    storedName,
    fileName: file.name.slice(0, 200) || storedName,
    mimeType: file.type || "application/octet-stream",
    size: buffer.length,
  };
}

export function uploadFilePath(storedName: string) {
  return path.join(UPLOAD_DIR, storedName);
}

export async function deleteUpload(storedName: string) {
  try {
    await unlink(uploadFilePath(storedName));
  } catch {
    // файла уже нет — игнорируем
  }
}
