import { readFile } from "node:fs/promises";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { uploadFilePath } from "@/lib/files";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const attachment = await prisma.attachment.findFirst({ where: { id, userId: user.id } });
  if (!attachment) return new Response("Not found", { status: 404 });

  let data: Buffer;
  try {
    data = await readFile(uploadFilePath(attachment.storedName));
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const asciiName = attachment.fileName.replace(/[^\x20-\x7E]/g, "_");
  const encodedName = encodeURIComponent(attachment.fileName);

  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": attachment.mimeType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${asciiName}"; filename*=UTF-8''${encodedName}`,
      "Content-Length": String(attachment.size),
      "Cache-Control": "private, no-store",
    },
  });
}
