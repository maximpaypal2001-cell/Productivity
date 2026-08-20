import { getCurrentUser } from "@/lib/auth";
import { getTransactions, summarize, endOfDay } from "@/lib/reports";
import { formatDate } from "@/lib/format";

function csvField(value: string | number) {
  const str = String(value);
  if (/[";\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function csvRow(fields: (string | number)[]) {
  return fields.map(csvField).join(";");
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const url = new URL(req.url);
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");
  const from = fromParam ? new Date(fromParam) : undefined;
  const to = toParam ? endOfDay(new Date(toParam)) : undefined;

  const transactions = await getTransactions(user.id, from, to);
  const summary = summarize(transactions, user.taxRatePercent);

  const lines: string[] = [];
  lines.push(csvRow(["Дата", "Тип", "Описание", "Категория / где", "Приход", "Расход", "Прибыль"]));
  for (const t of transactions) {
    lines.push(
      csvRow([
        formatDate(t.date),
        t.type === "sale" ? "Продажа" : "Расход",
        t.description,
        t.category ?? "",
        t.income.toFixed(2),
        t.outcome.toFixed(2),
        t.profit.toFixed(2),
      ])
    );
  }
  lines.push("");
  lines.push(csvRow(["Итого выручка от продаж", "", "", "", summary.revenue.toFixed(2)]));
  lines.push(csvRow(["Итого себестоимость проданного", "", "", "", summary.costOfGoods.toFixed(2)]));
  lines.push(csvRow(["Итого прочие расходы", "", "", "", summary.otherExpenses.toFixed(2)]));
  lines.push(csvRow(["Валовая прибыль", "", "", "", summary.grossProfit.toFixed(2)]));
  lines.push(csvRow(["Чистая прибыль", "", "", "", summary.netProfit.toFixed(2)]));
  lines.push(csvRow([`Оценка налога (${user.taxRatePercent}%)`, "", "", "", summary.estimatedTax.toFixed(2)]));

  const csv = "﻿" + lines.join("\r\n");
  const rangeLabel = `${fromParam ?? "all"}_${toParam ?? "all"}`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="report_${rangeLabel}.csv"`,
    },
  });
}
