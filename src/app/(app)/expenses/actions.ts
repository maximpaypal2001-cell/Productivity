"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { addAttachmentsToEntity, deleteAttachmentById, deleteFilesForAttachments, filesFromFormData } from "@/lib/attachments";

const expenseSchema = z.object({
  date: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Некорректная дата"),
  category: z.string().trim().max(100).optional(),
  description: z.string().trim().min(1, "Опишите расход").max(300),
  amount: z.coerce.number().min(0, "Сумма не может быть отрицательной"),
});

function readExpenseForm(formData: FormData) {
  return expenseSchema.safeParse({
    date: formData.get("date"),
    category: formData.get("category") || undefined,
    description: formData.get("description"),
    amount: formData.get("amount"),
  });
}

export async function createExpense(formData: FormData) {
  const user = await requireUser();
  const parsed = readExpenseForm(formData);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Проверьте введённые данные";
    redirect(`/expenses?error=${encodeURIComponent(message)}`);
  }

  const expense = await prisma.expense.create({
    data: {
      userId: user.id,
      date: new Date(parsed.data.date),
      category: parsed.data.category || null,
      description: parsed.data.description,
      amount: parsed.data.amount,
    },
  });

  await addAttachmentsToEntity(user.id, { expenseId: expense.id }, filesFromFormData(formData));

  redirect("/expenses");
}

export async function updateExpense(expenseId: string, formData: FormData) {
  const user = await requireUser();
  const existing = await prisma.expense.findFirst({ where: { id: expenseId, userId: user.id } });
  if (!existing) redirect("/expenses");

  const parsed = readExpenseForm(formData);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Проверьте введённые данные";
    redirect(`/expenses/${expenseId}?error=${encodeURIComponent(message)}`);
  }

  await prisma.expense.update({
    where: { id: expenseId },
    data: {
      date: new Date(parsed.data.date),
      category: parsed.data.category || null,
      description: parsed.data.description,
      amount: parsed.data.amount,
    },
  });

  await addAttachmentsToEntity(user.id, { expenseId }, filesFromFormData(formData));

  redirect(`/expenses/${expenseId}`);
}

export async function deleteExpense(expenseId: string) {
  const user = await requireUser();
  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, userId: user.id },
    include: { attachments: true },
  });
  if (!expense) redirect("/expenses");

  await deleteFilesForAttachments(expense.attachments);
  await prisma.expense.delete({ where: { id: expenseId } });
  redirect("/expenses");
}

export async function deleteExpenseAttachment(expenseId: string, attachmentId: string) {
  const user = await requireUser();
  await deleteAttachmentById(user.id, attachmentId);
  revalidatePath(`/expenses/${expenseId}`);
}
