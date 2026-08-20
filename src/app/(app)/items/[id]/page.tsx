import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney, toDateInputValue } from "@/lib/format";
import { AttachmentList } from "@/components/AttachmentList";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import {
  deleteItem,
  deleteItemAttachment,
  markItemSold,
  revertSale,
  updateItem,
  updateSale,
} from "../actions";

export default async function ItemDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { error } = await searchParams;

  const item = await prisma.item.findFirst({
    where: { id, userId: user.id },
    include: { attachments: true, sale: { include: { attachments: true } } },
  });
  if (!item) notFound();

  const profit = item.sale ? item.sale.salePrice - item.purchasePrice : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/items" className="hover:underline">
          Товары
        </Link>
        <span>/</span>
        <span className="truncate">{item.name}</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{item.name}</h1>
          {item.sale ? (
            <span className="badge-green mt-1">Продан</span>
          ) : (
            <span className="badge-amber mt-1">В наличии</span>
          )}
        </div>
        <form action={deleteItem.bind(null, item.id)}>
          <ConfirmSubmitButton
            confirmMessage="Удалить товар вместе с данными о продаже и файлами? Действие необратимо."
            className="btn-danger"
          >
            Удалить товар
          </ConfirmSubmitButton>
        </form>
      </div>

      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {item.sale && (
        <div className="card bg-brand-50">
          <p className="text-sm text-slate-600">Прибыль по товару</p>
          <p className={`text-2xl font-semibold ${profit! >= 0 ? "text-brand-700" : "text-red-600"}`}>
            {profit! >= 0 ? "+" : ""}
            {formatMoney(profit!)}
          </p>
          <p className="text-xs text-slate-500">
            {formatMoney(item.sale.salePrice)} (продажа) − {formatMoney(item.purchasePrice)} (покупка)
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Покупка */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-slate-900">Покупка</h2>
          <form action={updateItem.bind(null, item.id)} encType="multipart/form-data" className="space-y-4">
            <div>
              <label className="label" htmlFor="name">
                Название товара *
              </label>
              <input className="input" id="name" name="name" required defaultValue={item.name} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="category">
                  Категория
                </label>
                <input className="input" id="category" name="category" defaultValue={item.category ?? ""} />
              </div>
              <div>
                <label className="label" htmlFor="brand">
                  Марка / модель
                </label>
                <input className="input" id="brand" name="brand" defaultValue={item.brand ?? ""} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="purchaseDate">
                  Дата покупки *
                </label>
                <input
                  className="input"
                  id="purchaseDate"
                  name="purchaseDate"
                  type="date"
                  required
                  defaultValue={toDateInputValue(item.purchaseDate)}
                />
              </div>
              <div>
                <label className="label" htmlFor="purchasePrice">
                  Сколько заплатили, ₽ *
                </label>
                <input
                  className="input"
                  id="purchasePrice"
                  name="purchasePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  defaultValue={item.purchasePrice}
                />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="purchaseSource">
                Где / у кого купили
              </label>
              <input className="input" id="purchaseSource" name="purchaseSource" defaultValue={item.purchaseSource ?? ""} />
            </div>
            <div>
              <label className="label" htmlFor="notes">
                Заметки
              </label>
              <textarea className="textarea" id="notes" name="notes" defaultValue={item.notes ?? ""} />
            </div>
            <div>
              <label className="label" htmlFor="files">
                Добавить чек / фото
              </label>
              <input className="input" id="files" name="files" type="file" multiple accept="image/*,.pdf" />
            </div>
            <button type="submit" className="btn-primary">
              Сохранить изменения
            </button>
          </form>
          <div className="border-t border-slate-100 pt-3">
            <p className="label">Файлы покупки</p>
            <AttachmentList attachments={item.attachments} onDelete={deleteItemAttachment.bind(null, item.id)} />
          </div>
        </div>

        {/* Продажа */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-slate-900">Продажа</h2>
          {item.sale ? (
            <>
              <form action={updateSale.bind(null, item.sale.id)} encType="multipart/form-data" className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="saleDate">
                      Дата продажи *
                    </label>
                    <input
                      className="input"
                      id="saleDate"
                      name="saleDate"
                      type="date"
                      required
                      defaultValue={toDateInputValue(item.sale.saleDate)}
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="salePrice">
                      За сколько продали, ₽ *
                    </label>
                    <input
                      className="input"
                      id="salePrice"
                      name="salePrice"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      defaultValue={item.sale.salePrice}
                    />
                  </div>
                </div>
                <div>
                  <label className="label" htmlFor="saleLocation">
                    Где продали
                  </label>
                  <input
                    className="input"
                    id="saleLocation"
                    name="saleLocation"
                    placeholder="Авито, Wildberries, лично..."
                    defaultValue={item.sale.saleLocation ?? ""}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="buyerInfo">
                    Покупатель
                  </label>
                  <input className="input" id="buyerInfo" name="buyerInfo" defaultValue={item.sale.buyerInfo ?? ""} />
                </div>
                <div>
                  <label className="label" htmlFor="notes">
                    Заметки
                  </label>
                  <textarea className="textarea" id="notes" name="notes" defaultValue={item.sale.notes ?? ""} />
                </div>
                <div>
                  <label className="label" htmlFor="files">
                    Добавить чек / фото
                  </label>
                  <input className="input" id="files" name="files" type="file" multiple accept="image/*,.pdf" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="submit" className="btn-primary">
                    Сохранить изменения
                  </button>
                  <form action={revertSale.bind(null, item.id)}>
                    <ConfirmSubmitButton
                      confirmMessage="Отменить продажу и вернуть товар в наличие?"
                      className="btn-secondary"
                    >
                      Отменить продажу
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </form>
              <div className="border-t border-slate-100 pt-3">
                <p className="label">Файлы продажи</p>
                <AttachmentList
                  attachments={item.sale.attachments}
                  onDelete={deleteItemAttachment.bind(null, item.id)}
                />
              </div>
            </>
          ) : (
            <form action={markItemSold.bind(null, item.id)} encType="multipart/form-data" className="space-y-4">
              <p className="text-sm text-slate-500">Отметьте товар как проданный, когда он уйдёт с рук.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="saleDate">
                    Дата продажи *
                  </label>
                  <input
                    className="input"
                    id="saleDate"
                    name="saleDate"
                    type="date"
                    required
                    defaultValue={toDateInputValue(new Date())}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="salePrice">
                    За сколько продали, ₽ *
                  </label>
                  <input
                    className="input"
                    id="salePrice"
                    name="salePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label" htmlFor="saleLocation">
                  Где продали
                </label>
                <input
                  className="input"
                  id="saleLocation"
                  name="saleLocation"
                  placeholder="Авито, Wildberries, лично..."
                />
              </div>
              <div>
                <label className="label" htmlFor="buyerInfo">
                  Покупатель
                </label>
                <input className="input" id="buyerInfo" name="buyerInfo" />
              </div>
              <div>
                <label className="label" htmlFor="notes">
                  Заметки
                </label>
                <textarea className="textarea" id="notes" name="notes" />
              </div>
              <div>
                <label className="label" htmlFor="files">
                  Чек / фото продажи
                </label>
                <input className="input" id="files" name="files" type="file" multiple accept="image/*,.pdf" />
              </div>
              <button type="submit" className="btn-primary">
                Отметить как проданный
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
