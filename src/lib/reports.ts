import "server-only";
import { prisma } from "@/lib/db";

export type Transaction = {
  id: string;
  date: Date;
  type: "sale" | "expense";
  description: string;
  category: string | null;
  income: number;
  outcome: number;
  profit: number;
};

export async function getTransactions(userId: string, from?: Date, to?: Date): Promise<Transaction[]> {
  const dateFilter = from || to ? { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } : undefined;

  const [sales, expenses] = await Promise.all([
    prisma.sale.findMany({
      where: { item: { userId }, ...(dateFilter ? { saleDate: dateFilter } : {}) },
      include: { item: true },
      orderBy: { saleDate: "desc" },
    }),
    prisma.expense.findMany({
      where: { userId, ...(dateFilter ? { date: dateFilter } : {}) },
      orderBy: { date: "desc" },
    }),
  ]);

  const saleTx: Transaction[] = sales.map((s) => ({
    id: `sale-${s.id}`,
    date: s.saleDate,
    type: "sale" as const,
    description: s.item.name,
    category: s.saleLocation,
    income: s.salePrice,
    outcome: s.item.purchasePrice,
    profit: s.salePrice - s.item.purchasePrice,
  }));

  const expenseTx: Transaction[] = expenses.map((e) => ({
    id: `expense-${e.id}`,
    date: e.date,
    type: "expense" as const,
    description: e.description,
    category: e.category,
    income: 0,
    outcome: e.amount,
    profit: -e.amount,
  }));

  return [...saleTx, ...expenseTx].sort((a, b) => b.date.getTime() - a.date.getTime());
}

export type Summary = {
  revenue: number;
  costOfGoods: number;
  otherExpenses: number;
  grossProfit: number;
  netProfit: number;
  estimatedTax: number;
  itemsSoldCount: number;
};

export function summarize(transactions: Transaction[], taxRatePercent: number): Summary {
  const sales = transactions.filter((t) => t.type === "sale");
  const revenue = sales.reduce((sum, t) => sum + t.income, 0);
  const costOfGoods = sales.reduce((sum, t) => sum + t.outcome, 0);
  const otherExpenses = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.outcome, 0);
  const grossProfit = revenue - costOfGoods;
  const netProfit = grossProfit - otherExpenses;
  const estimatedTax = netProfit > 0 ? (netProfit * taxRatePercent) / 100 : 0;

  return {
    revenue,
    costOfGoods,
    otherExpenses,
    grossProfit,
    netProfit,
    estimatedTax,
    itemsSoldCount: sales.length,
  };
}

export function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function startOfYear(date = new Date()) {
  return new Date(date.getFullYear(), 0, 1);
}

export function endOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}
