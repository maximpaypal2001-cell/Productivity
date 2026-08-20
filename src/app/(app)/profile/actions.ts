"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser, hashPassword, verifyPassword } from "@/lib/auth";

const profileSchema = z.object({
  name: z.string().trim().max(100).optional(),
  taxRatePercent: z.coerce.number().min(0).max(100),
});

export async function updateProfile(formData: FormData) {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({
    name: formData.get("name") || undefined,
    taxRatePercent: formData.get("taxRatePercent"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Проверьте введённые данные";
    redirect(`/profile?error=${encodeURIComponent(message)}`);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name || null, taxRatePercent: parsed.data.taxRatePercent },
  });

  redirect("/profile?saved=1");
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(6, "Новый пароль должен быть не короче 6 символов"),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Пароли не совпадают",
    path: ["confirmNewPassword"],
  });

export async function changePassword(formData: FormData) {
  const user = await requireUser();
  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmNewPassword: formData.get("confirmNewPassword"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Проверьте введённые данные";
    redirect(`/profile?error=${encodeURIComponent(message)}`);
  }

  const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    redirect(`/profile?error=${encodeURIComponent("Текущий пароль неверен")}`);
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  redirect("/profile?saved=1");
}
