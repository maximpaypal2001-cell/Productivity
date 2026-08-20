import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";

const STATUS_TABS = [
  { value: "all", label: "Все" },
  { value: "IN_STOCK", label: "В наличии" },
  { value: "SOLD", label: "Проданные" },
] as const;

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const user = await requireUser();
  const { status, q } = await searchParams;
  const activeStatus = status === "IN_STOCK" || status === "SOLD" ? status : "all";

  const items = await prisma.item.findMany({
    where: {
      userId: user.id,
      ...(activeStatus !== "all" ? { status: activeStatus } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { brand: { contains: q } },
              { category: { contains: q } },
            ],
          }
        : {}),
    },
    include: { sale: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900">Товары</h1>
        <Link href="/items/new" className="btn-primary">
          + Добавить товар
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-sm">
          {STATUS_TABS.map((tab) => (
            <Link
              key={tab.value}
              href={`/items?status=${tab.value}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={`rounded-md px-3 py-1.5 font-medium ${
                activeStatus === tab.value ? "bg-white shadow-sm text-slate-900" : "text-slate-600"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
        <form className="flex-1 sm:max-w-xs" action="/items">
          <input type="hidden" name="status" value={activeStatus} />
          <input
            className="input"
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Поиск по названию, бренду..."
          />
        </form>
      </div>

      {items.length === 0 ? (
        <div className="card text-center text-sm text-slate-500">
          Пока нет товаров. Нажмите «Добавить товар», чтобы внести первую покупку.
        </div>
      ) : (
        <div className="card divide-y divide-slate-100 !p-0">
          {items.map((item) => {
            const profit = item.sale ? item.sale.salePrice - item.purchasePrice : null;
            return (
              <Link
                key={item.id}
                href={`/items/${item.id}`}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-slate-50 sm:px-6"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">
                    {item.name}
                    {item.brand ? <span className="font-normal text-slate-500"> · {item.brand}</span> : null}
                  </p>
                  <p className="text-xs text-slate-500">
                    Куплен {formatDate(item.purchaseDate)} за {formatMoney(item.purchasePrice)}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {item.sale ? (
                    <>
                      <span className={profit! >= 0 ? "text-emerald-600" : "text-red-600"}>
                        {profit! >= 0 ? "+" : ""}
                        {formatMoney(profit!)}
                      </span>
                      <span className="badge-green">Продан</span>
                    </>
                  ) : (
                    <span className="badge-amber">В наличии</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
