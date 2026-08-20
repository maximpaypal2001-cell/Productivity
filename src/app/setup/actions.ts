"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession, hashPassword, hasAnyUser } from "@/lib/auth";

const schema = z
  .object({
    name: z.string().trim().max(100).optional(),
    email: z.string().trim().email("Введите корректный email"),
    password: z.string().min(6, "Пароль должен быть не короче 6 символов"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

export async function setupAction(formData: FormData) {
  if (await hasAnyUser()) {
    redirect("/login");
  }

  const parsed = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Проверьте введённые данные";
    redirect(`/setup?error=${encodeURIComponent(message)}`);
  }

  const { name, email, password } = parsed.data;
  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      name: name || null,
    },
  });

  await createSession(user.id);
  redirect("/dashboard");
}
