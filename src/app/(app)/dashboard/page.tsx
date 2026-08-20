import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { getTransactions, summarize, startOfMonth, endOfDay } from "@/lib/reports";

export default async function DashboardPage() {
  const user = await requireUser();

  const [monthTx, allTx, inStockItems, recentItems] = await Promise.all([
    getTransactions(user.id, startOfMonth(), endOfDay()),
    getTransactions(user.id),
    prisma.item.findMany({ where: { userId: user.id, status: "IN_STOCK" } }),
    prisma.item.findMany({
      where: { userId: user.id },
      include: { sale: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const monthSummary = summarize(monthTx, user.taxRatePercent);
  const allSummary = summarize(allTx, user.taxRatePercent);
  const stockValue = inStockItems.reduce((sum, i) => sum + i.purchasePrice, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900">
          Здравствуйте{user.name ? `, ${user.name}` : ""}!
        </h1>
        <div className="flex gap-2">
          <Link href="/items/new" className="btn-primary">
            + Товар
          </Link>
          <Link href="/reports" className="btn-secondary">
            Отчёты
          </Link>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-500">Этот месяц</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Выручка от продаж" value={formatMoney(monthSummary.revenue)} />
          <StatCard label="Расходы" value={formatMoney(monthSummary.costOfGoods + monthSummary.otherExpenses)} />
          <StatCard
            label="Чистая прибыль"
            value={formatMoney(monthSummary.netProfit)}
            tone={monthSummary.netProfit >= 0 ? "positive" : "negative"}
          />
          <StatCard label={`Налог (${user.taxRatePercent}%), оценка`} value={formatMoney(monthSummary.estimatedTax)} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-500">За всё время</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Выручка от продаж" value={formatMoney(allSummary.revenue)} />
          <StatCard label="Продано товаров" value={String(allSummary.itemsSoldCount)} />
          <StatCard
            label="Чистая прибыль"
            value={formatMoney(allSummary.netProfit)}
            tone={allSummary.netProfit >= 0 ? "positive" : "negative"}
          />
          <StatCard label="В наличии (на сумму)" value={`${inStockItems.length} шт · ${formatMoney(stockValue)}`} />
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">Недавние товары</h2>
          <Link href="/items" className="text-sm text-brand-700 hover:underline">
            Все товары →
          </Link>
        </div>
        {recentItems.length === 0 ? (
          <div className="card text-center text-sm text-slate-500">
            Товаров пока нет.{" "}
            <Link href="/items/new" className="text-brand-700 hover:underline">
              Добавьте первую покупку
            </Link>
            .
          </div>
        ) : (
          <div className="card divide-y divide-slate-100 !p-0">
            {recentItems.map((item) => (
              <Link
                key={item.id}
                href={`/items/${item.id}`}
                className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-slate-50 sm:px-6"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">Куплен {formatDate(item.purchaseDate)}</p>
                </div>
                {item.sale ? <span className="badge-green">Продан</span> : <span className="badge-amber">В наличии</span>}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative";
}) {
  return (
    <div className="card">
      <p className="text-xs text-slate-500">{label}</p>
      <p
        className={`mt-1 text-lg font-semibold ${
          tone === "positive" ? "text-emerald-600" : tone === "negative" ? "text-red-600" : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
