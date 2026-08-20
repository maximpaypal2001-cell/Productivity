import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { createExpense } from "./actions";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const { error } = await searchParams;
  const today = new Date().toISOString().slice(0, 10);

  const expenses = await prisma.expense.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
  });
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Расходы</h1>
      <p className="text-sm text-slate-500">
        Расходы бизнеса, не привязанные к конкретному товару: упаковка, доставка, реклама, подписки и т.д.
      </p>

      <details className="card" open>
        <summary className="cursor-pointer font-medium text-slate-900">Добавить расход</summary>
        <form action={createExpense} encType="multipart/form-data" className="mt-4 space-y-4">
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="date">
                Дата *
              </label>
              <input className="input" id="date" name="date" type="date" required defaultValue={today} />
            </div>
            <div>
              <label className="label" htmlFor="amount">
                Сумма, ₽ *
              </label>
              <input className="input" id="amount" name="amount" type="number" step="0.01" min="0" required />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="category">
              Категория
            </label>
            <input
              className="input"
              id="category"
              name="category"
              list="expense-category-suggestions"
              placeholder="Упаковка, доставка, реклама..."
            />
            <datalist id="expense-category-suggestions">
              <option value="Упаковка" />
              <option value="Доставка" />
              <option value="Реклама" />
              <option value="Комиссия площадки" />
              <option value="Материалы" />
              <option value="Прочее" />
            </datalist>
          </div>
          <div>
            <label className="label" htmlFor="description">
              Описание *
            </label>
            <input className="input" id="description" name="description" required placeholder="На что потрачено" />
          </div>
          <div>
            <label className="label" htmlFor="files">
              Чек
            </label>
            <input className="input" id="files" name="files" type="file" multiple accept="image/*,.pdf" />
          </div>
          <button type="submit" className="btn-primary">
            Добавить
          </button>
        </form>
      </details>

      <div className="card !p-0">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-6">
          <p className="font-medium text-slate-900">Все расходы</p>
          <p className="text-sm text-slate-500">Итого: {formatMoney(total)}</p>
        </div>
        {expenses.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500 sm:px-6">Расходов пока нет.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {expenses.map((expense) => (
              <Link
                key={expense.id}
                href={`/expenses/${expense.id}`}
                className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-slate-50 sm:px-6"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{expense.description}</p>
                  <p className="text-xs text-slate-500">
                    {formatDate(expense.date)}
                    {expense.category ? ` · ${expense.category}` : ""}
                  </p>
                </div>
                <p className="shrink-0 font-medium text-slate-900">{formatMoney(expense.amount)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
