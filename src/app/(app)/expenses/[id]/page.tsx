import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toDateInputValue } from "@/lib/format";
import { AttachmentList } from "@/components/AttachmentList";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { deleteExpense, deleteExpenseAttachment, updateExpense } from "../actions";

export default async function ExpenseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { error } = await searchParams;

  const expense = await prisma.expense.findFirst({
    where: { id, userId: user.id },
    include: { attachments: true },
  });
  if (!expense) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/expenses" className="hover:underline">
          Расходы
        </Link>
        <span>/</span>
        <span className="truncate">{expense.description}</span>
      </div>

      <div className="flex items-start justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900">{expense.description}</h1>
        <form action={deleteExpense.bind(null, expense.id)}>
          <ConfirmSubmitButton confirmMessage="Удалить расход?" className="btn-danger">
            Удалить
          </ConfirmSubmitButton>
        </form>
      </div>

      <div className="card space-y-4">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <form action={updateExpense.bind(null, expense.id)} encType="multipart/form-data" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="date">
                Дата *
              </label>
              <input
                className="input"
                id="date"
                name="date"
                type="date"
                required
                defaultValue={toDateInputValue(expense.date)}
              />
            </div>
            <div>
              <label className="label" htmlFor="amount">
                Сумма, ₽ *
              </label>
              <input
                className="input"
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={expense.amount}
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="category">
              Категория
            </label>
            <input className="input" id="category" name="category" defaultValue={expense.category ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="description">
              Описание *
            </label>
            <input className="input" id="description" name="description" required defaultValue={expense.description} />
          </div>
          <div>
            <label className="label" htmlFor="files">
              Добавить чек
            </label>
            <input className="input" id="files" name="files" type="file" multiple accept="image/*,.pdf" />
          </div>
          <button type="submit" className="btn-primary">
            Сохранить изменения
          </button>
        </form>
        <div className="border-t border-slate-100 pt-3">
          <p className="label">Файлы</p>
          <AttachmentList attachments={expense.attachments} onDelete={deleteExpenseAttachment.bind(null, expense.id)} />
        </div>
      </div>
    </div>
  );
}
