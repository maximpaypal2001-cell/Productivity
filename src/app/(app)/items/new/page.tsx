import Link from "next/link";
import { createItem } from "../actions";

export default async function NewItemPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/items" className="hover:underline">
          Товары
        </Link>
        <span>/</span>
        <span>Новый товар</span>
      </div>
      <h1 className="text-xl font-semibold text-slate-900">Новая покупка</h1>

      <form action={createItem} encType="multipart/form-data" className="card space-y-4">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div>
          <label className="label" htmlFor="name">
            Название товара *
          </label>
          <input className="input" id="name" name="name" required placeholder="Например: iPhone 13" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="category">
              Категория
            </label>
            <input
              className="input"
              id="category"
              name="category"
              list="category-suggestions"
              placeholder="Электроника, одежда..."
            />
            <datalist id="category-suggestions">
              <option value="Электроника" />
              <option value="Одежда" />
              <option value="Обувь" />
              <option value="Аксессуары" />
              <option value="Мебель" />
              <option value="Прочее" />
            </datalist>
          </div>
          <div>
            <label className="label" htmlFor="brand">
              Марка / модель
            </label>
            <input className="input" id="brand" name="brand" placeholder="Apple, iPhone 13 128GB" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="purchaseDate">
              Дата покупки *
            </label>
            <input className="input" id="purchaseDate" name="purchaseDate" type="date" required defaultValue={today} />
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
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="purchaseSource">
            Где / у кого купили
          </label>
          <input className="input" id="purchaseSource" name="purchaseSource" placeholder="Авито, магазин, поставщик..." />
        </div>

        <div>
          <label className="label" htmlFor="notes">
            Заметки
          </label>
          <textarea className="textarea" id="notes" name="notes" placeholder="Любые дополнительные детали" />
        </div>

        <div>
          <label className="label" htmlFor="files">
            Чеки / фото товара
          </label>
          <input className="input" id="files" name="files" type="file" multiple accept="image/*,.pdf" />
          <p className="mt-1 text-xs text-slate-500">Можно выбрать сразу несколько файлов.</p>
        </div>

        <div className="flex gap-2 pt-2">
          <button type="submit" className="btn-primary">
            Сохранить
          </button>
          <Link href="/items" className="btn-secondary">
            Отмена
          </Link>
        </div>
      </form>
    </div>
  );
}
