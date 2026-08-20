import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { formatDate, formatMoney, toDateInputValue } from "@/lib/format";
import { getTransactions, summarize, startOfMonth, startOfYear, endOfDay } from "@/lib/reports";

function presetRange(preset: string | undefined) {
  const now = new Date();
  switch (preset) {
    case "last-month": {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from, to: endOfDay(to) };
    }
    case "year":
      return { from: startOfYear(now), to: endOfDay(now) };
    case "all":
      return { from: undefined, to: undefined };
    case "month":
    default:
      return { from: startOfMonth(now), to: endOfDay(now) };
  }
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; preset?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;

  let from: Date | undefined;
  let to: Date | undefined;

  if (sp.from || sp.to) {
    from = sp.from ? new Date(sp.from) : undefined;
    to = sp.to ? endOfDay(new Date(sp.to)) : undefined;
  } else {
    const range = presetRange(sp.preset);
    from = range.from;
    to = range.to;
  }

  const transactions = await getTransactions(user.id, from, to);
  const summary = summarize(transactions, user.taxRatePercent);

  const exportHref = `/api/reports/export?${new URLSearchParams({
    ...(from ? { from: toDateInputValue(from) } : {}),
    ...(to ? { to: toDateInputValue(to) } : {}),
  }).toString()}`;

  const presets = [
    { value: "month", label: "Этот месяц" },
    { value: "last-month", label: "Прошлый месяц" },
    { value: "year", label: "Этот год" },
    { value: "all", label: "Всё время" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900">Отчёты</h1>
        <a href={exportHref} className="btn-secondary">
          Скачать CSV
        </a>
      </div>

      <div className="card space-y-4">
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <Link key={p.value} href={`/reports?preset=${p.value}`} className="btn-secondary text-xs">
              {p.label}
            </Link>
          ))}
        </div>
        <form className="flex flex-wrap items-end gap-3" action="/reports">
          <div>
            <label className="label" htmlFor="from">
              С даты
            </label>
            <input className="input" id="from" name="from" type="date" defaultValue={from ? toDateInputValue(from) : ""} />
          </div>
          <div>
            <label className="label" htmlFor="to">
              По дату
            </label>
            <input className="input" id="to" name="to" type="date" defaultValue={to ? toDateInputValue(to) : ""} />
          </div>
          <button type="submit" className="btn-primary">
            Показать
          </button>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryRow label="Выручка от продаж" value={formatMoney(summary.revenue)} />
        <SummaryRow label="Себестоимость проданного" value={formatMoney(summary.costOfGoods)} />
        <SummaryRow label="Валовая прибыль" value={formatMoney(summary.grossProfit)} />
        <SummaryRow label="Прочие расходы" value={formatMoney(summary.otherExpenses)} />
        <SummaryRow label="Чистая прибыль" value={formatMoney(summary.netProfit)} emphasize />
        <SummaryRow label={`Налог (${user.taxRatePercent}%), оценка`} value={formatMoney(summary.estimatedTax)} />
      </div>
      <p className="text-xs text-slate-400">
        Ставка налога задаётся в разделе «Профиль». Оценка приблизительная и не заменяет консультацию с бухгалтером
        или налоговой.
      </p>

      <div className="card !p-0">
        <div className="border-b border-slate-100 px-4 py-3 font-medium text-slate-900 sm:px-6">
          Операции ({transactions.length})
        </div>
        {transactions.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500 sm:px-6">Нет операций за выбранный период.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-2 sm:px-6">Дата</th>
                  <th className="px-4 py-2 sm:px-6">Тип</th>
                  <th className="px-4 py-2 sm:px-6">Описание</th>
                  <th className="px-4 py-2 sm:px-6">Категория / где</th>
                  <th className="px-4 py-2 text-right sm:px-6">Сумма</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="whitespace-nowrap px-4 py-2 sm:px-6">{formatDate(t.date)}</td>
                    <td className="px-4 py-2 sm:px-6">
                      {t.type === "sale" ? (
                        <span className="badge-green">Продажа</span>
                      ) : (
                        <span className="badge-amber">Расход</span>
                      )}
                    </td>
                    <td className="px-4 py-2 sm:px-6">{t.description}</td>
                    <td className="px-4 py-2 text-slate-500 sm:px-6">{t.category ?? "—"}</td>
                    <td
                      className={`whitespace-nowrap px-4 py-2 text-right font-medium sm:px-6 ${
                        t.profit >= 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {t.type === "sale" ? formatMoney(t.income) : `−${formatMoney(t.outcome)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className="card">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 font-semibold ${emphasize ? "text-lg text-brand-700" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}
