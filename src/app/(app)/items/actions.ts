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

const itemSchema = z.object({
  name: z.string().trim().min(1, "Укажите название товара").max(200),
  category: z.string().trim().max(100).optional(),
  brand: z.string().trim().max(100).optional(),
  purchaseDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Некорректная дата"),
  purchasePrice: z.coerce.number().min(0, "Цена не может быть отрицательной"),
  purchaseSource: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(2000).optional(),
});

function readItemForm(formData: FormData) {
  return itemSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category") || undefined,
    brand: formData.get("brand") || undefined,
    purchaseDate: formData.get("purchaseDate"),
    purchasePrice: formData.get("purchasePrice"),
    purchaseSource: formData.get("purchaseSource") || undefined,
    notes: formData.get("notes") || undefined,
  });
}

export async function createItem(formData: FormData) {
  const user = await requireUser();
  const parsed = readItemForm(formData);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Проверьте введённые данные";
    redirect(`/items/new?error=${encodeURIComponent(message)}`);
  }

  const item = await prisma.item.create({
    data: {
      userId: user.id,
      name: parsed.data.name,
      category: parsed.data.category || null,
      brand: parsed.data.brand || null,
      purchaseDate: new Date(parsed.data.purchaseDate),
      purchasePrice: parsed.data.purchasePrice,
      purchaseSource: parsed.data.purchaseSource || null,
      notes: parsed.data.notes || null,
    },
  });

  await addAttachmentsToEntity(user.id, { itemId: item.id }, filesFromFormData(formData));

  redirect(`/items/${item.id}`);
}

export async function updateItem(itemId: string, formData: FormData) {
  const user = await requireUser();
  const existing = await prisma.item.findFirst({ where: { id: itemId, userId: user.id } });
  if (!existing) redirect("/items");

  const parsed = readItemForm(formData);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Проверьте введённые данные";
    redirect(`/items/${itemId}?error=${encodeURIComponent(message)}`);
  }

  await prisma.item.update({
    where: { id: itemId },
    data: {
      name: parsed.data.name,
      category: parsed.data.category || null,
      brand: parsed.data.brand || null,
      purchaseDate: new Date(parsed.data.purchaseDate),
      purchasePrice: parsed.data.purchasePrice,
      purchaseSource: parsed.data.purchaseSource || null,
      notes: parsed.data.notes || null,
    },
  });

  await addAttachmentsToEntity(user.id, { itemId }, filesFromFormData(formData));

  revalidatePath(`/items/${itemId}`);
  redirect(`/items/${itemId}`);
}

export async function deleteItem(itemId: string) {
  const user = await requireUser();
  const item = await prisma.item.findFirst({
    where: { id: itemId, userId: user.id },
    include: { attachments: true, sale: { include: { attachments: true } } },
  });
  if (!item) redirect("/items");

  await deleteFilesForAttachments(item.attachments);
  if (item.sale) {
    await deleteFilesForAttachments(item.sale.attachments);
  }

  await prisma.item.delete({ where: { id: itemId } });
  redirect("/items");
}

const saleSchema = z.object({
  saleDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Некорректная дата"),
  salePrice: z.coerce.number().min(0, "Цена не может быть отрицательной"),
  saleLocation: z.string().trim().max(200).optional(),
  buyerInfo: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(2000).optional(),
});

function readSaleForm(formData: FormData) {
  return saleSchema.safeParse({
    saleDate: formData.get("saleDate"),
    salePrice: formData.get("salePrice"),
    saleLocation: formData.get("saleLocation") || undefined,
    buyerInfo: formData.get("buyerInfo") || undefined,
    notes: formData.get("notes") || undefined,
  });
}

export async function markItemSold(itemId: string, formData: FormData) {
  const user = await requireUser();
  const item = await prisma.item.findFirst({ where: { id: itemId, userId: user.id } });
  if (!item) redirect("/items");

  const parsed = readSaleForm(formData);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Проверьте введённые данные";
    redirect(`/items/${itemId}?error=${encodeURIComponent(message)}`);
  }

  const sale = await prisma.sale.create({
    data: {
      itemId,
      saleDate: new Date(parsed.data.saleDate),
      salePrice: parsed.data.salePrice,
      saleLocation: parsed.data.saleLocation || null,
      buyerInfo: parsed.data.buyerInfo || null,
      notes: parsed.data.notes || null,
    },
  });
  await prisma.item.update({ where: { id: itemId }, data: { status: "SOLD" } });

  await addAttachmentsToEntity(user.id, { saleId: sale.id }, filesFromFormData(formData));

  revalidatePath(`/items/${itemId}`);
  redirect(`/items/${itemId}`);
}

export async function updateSale(saleId: string, formData: FormData) {
  const user = await requireUser();
  const sale = await prisma.sale.findFirst({
    where: { id: saleId, item: { userId: user.id } },
    include: { item: true },
  });
  if (!sale) redirect("/items");

  const parsed = readSaleForm(formData);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Проверьте введённые данные";
    redirect(`/items/${sale.itemId}?error=${encodeURIComponent(message)}`);
  }

  await prisma.sale.update({
    where: { id: saleId },
    data: {
      saleDate: new Date(parsed.data.saleDate),
      salePrice: parsed.data.salePrice,
      saleLocation: parsed.data.saleLocation || null,
      buyerInfo: parsed.data.buyerInfo || null,
      notes: parsed.data.notes || null,
    },
  });

  await addAttachmentsToEntity(user.id, { saleId }, filesFromFormData(formData));

  revalidatePath(`/items/${sale.itemId}`);
  redirect(`/items/${sale.itemId}`);
}

// "Вернуть в наличие" — removes the sale record and marks the item unsold again.
export async function revertSale(itemId: string) {
  const user = await requireUser();
  const item = await prisma.item.findFirst({
    where: { id: itemId, userId: user.id },
    include: { sale: { include: { attachments: true } } },
  });
  if (!item || !item.sale) redirect(`/items/${itemId}`);

  await deleteFilesForAttachments(item.sale!.attachments);
  await prisma.sale.delete({ where: { id: item.sale!.id } });
  await prisma.item.update({ where: { id: itemId }, data: { status: "IN_STOCK" } });

  revalidatePath(`/items/${itemId}`);
  redirect(`/items/${itemId}`);
}

export async function deleteItemAttachment(itemId: string, attachmentId: string) {
  const user = await requireUser();
  await deleteAttachmentById(user.id, attachmentId);
  revalidatePath(`/items/${itemId}`);
}
