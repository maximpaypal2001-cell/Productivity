import "server-only";
import { prisma } from "@/lib/db";
import { saveUpload, deleteUpload } from "@/lib/files";

type AttachmentLink =
  | { itemId: string }
  | { saleId: string }
  | { expenseId: string }
  | { documentId: string };

export async function addAttachmentsToEntity(userId: string, link: AttachmentLink, files: File[]) {
  for (const file of files) {
    if (!file || file.size === 0) continue;
    const saved = await saveUpload(file);
    await prisma.attachment.create({
      data: {
        userId,
        fileName: saved.fileName,
        storedName: saved.storedName,
        mimeType: saved.mimeType,
        size: saved.size,
        ...link,
      },
    });
  }
}

// Deletes an attachment (and its file on disk) if it belongs to the given user.
export async function deleteAttachmentById(userId: string, attachmentId: string) {
  const attachment = await prisma.attachment.findFirst({
    where: { id: attachmentId, userId },
  });
  if (!attachment) return;
  await prisma.attachment.delete({ where: { id: attachment.id } });
  await deleteUpload(attachment.storedName);
}

// Deletes every attachment's file on disk for a set of attachments about to be
// cascade-deleted in the database (e.g. when the parent item/sale is removed).
export async function deleteFilesForAttachments(attachments: { storedName: string }[]) {
  for (const attachment of attachments) {
    await deleteUpload(attachment.storedName);
  }
}

export function filesFromFormData(formData: FormData, fieldName = "files"): File[] {
  return formData
    .getAll(fieldName)
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
}
