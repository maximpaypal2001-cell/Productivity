"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import {
  addAttachmentsToEntity,
  deleteAttachmentById,
  deleteFilesForAttachments,
  filesFromFormData,
} from "@/lib/attachments";

const documentSchema = z.object({
  title: z.string().trim().min(1, "Укажите название документа").max(200),
  category: z.string().trim().max(100).optional(),
  date: z.string().optional(),
  notes: z.string().trim().max(2000).optional(),
});

function readDocumentForm(formData: FormData) {
  return documentSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category") || undefined,
    date: formData.get("date") || undefined,
    notes: formData.get("notes") || undefined,
  });
}

export async function createDocument(formData: FormData) {
  const user = await requireUser();
  const parsed = readDocumentForm(formData);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Проверьте введённые данные";
    redirect(`/documents?error=${encodeURIComponent(message)}`);
  }

  const files = filesFromFormData(formData);
  if (files.length === 0) {
    redirect(`/documents?error=${encodeURIComponent("Прикрепите хотя бы один файл")}`);
  }

  const document = await prisma.document.create({
    data: {
      userId: user.id,
      title: parsed.data.title,
      category: parsed.data.category || null,
      date: parsed.data.date ? new Date(parsed.data.date) : null,
      notes: parsed.data.notes || null,
    },
  });

  await addAttachmentsToEntity(user.id, { documentId: document.id }, files);

  redirect("/documents");
}

export async function updateDocument(documentId: string, formData: FormData) {
  const user = await requireUser();
  const existing = await prisma.document.findFirst({ where: { id: documentId, userId: user.id } });
  if (!existing) redirect("/documents");

  const parsed = readDocumentForm(formData);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Проверьте введённые данные";
    redirect(`/documents/${documentId}?error=${encodeURIComponent(message)}`);
  }

  await prisma.document.update({
    where: { id: documentId },
    data: {
      title: parsed.data.title,
      category: parsed.data.category || null,
      date: parsed.data.date ? new Date(parsed.data.date) : null,
      notes: parsed.data.notes || null,
    },
  });

  await addAttachmentsToEntity(user.id, { documentId }, filesFromFormData(formData));

  revalidatePath(`/documents/${documentId}`);
  redirect(`/documents/${documentId}`);
}

export async function deleteDocument(documentId: string) {
  const user = await requireUser();
  const document = await prisma.document.findFirst({
    where: { id: documentId, userId: user.id },
    include: { attachments: true },
  });
  if (!document) redirect("/documents");

  await deleteFilesForAttachments(document.attachments);
  await prisma.document.delete({ where: { id: documentId } });
  redirect("/documents");
}

export async function deleteDocumentAttachment(documentId: string, attachmentId: string) {
  const user = await requireUser();
  await deleteAttachmentById(user.id, attachmentId);
  revalidatePath(`/documents/${documentId}`);
}
