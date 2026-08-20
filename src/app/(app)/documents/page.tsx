import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { createDocument } from "./actions";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const { error } = await searchParams;

  const documents = await prisma.document.findMany({
    where: { userId: user.id },
    include: { attachments: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Документы</h1>
      <p className="text-sm text-slate-500">
        Личное хранилище любых документов, связанных с вашей самозанятостью: справки, договоры, регистрация и т.д.
      </p>

      <details className="card" open>
        <summary className="cursor-pointer font-medium text-slate-900">Загрузить документ</summary>
        <form action={createDocument} encType="multipart/form-data" className="mt-4 space-y-4">
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div>
            <label className="label" htmlFor="title">
              Название *
            </label>
            <input className="input" id="title" name="title" required placeholder="Справка о постановке на учёт" />
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
                list="document-category-suggestions"
                placeholder="Регистрация, договор, справка..."
              />
              <datalist id="document-category-suggestions">
                <option value="Регистрация" />
                <option value="Договор" />
                <option value="Справка" />
                <option value="Налоги" />
                <option value="Прочее" />
              </datalist>
            </div>
            <div>
              <label className="label" htmlFor="date">
                Дата документа
              </label>
              <input className="input" id="date" name="date" type="date" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="notes">
              Заметки
            </label>
            <textarea className="textarea" id="notes" name="notes" />
          </div>
          <div>
            <label className="label" htmlFor="files">
              Файл(ы) *
            </label>
            <input className="input" id="files" name="files" type="file" multiple required accept="image/*,.pdf,.doc,.docx" />
          </div>
          <button type="submit" className="btn-primary">
            Загрузить
          </button>
        </form>
      </details>

      <div className="card !p-0">
        <div className="border-b border-slate-100 px-4 py-3 font-medium text-slate-900 sm:px-6">Все документы</div>
        {documents.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500 sm:px-6">Документов пока нет.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <Link
                key={doc.id}
                href={`/documents/${doc.id}`}
                className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-slate-50 sm:px-6"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{doc.title}</p>
                  <p className="text-xs text-slate-500">
                    {doc.category ?? "Без категории"}
                    {doc.date ? ` · ${formatDate(doc.date)}` : ""} · {doc.attachments.length}{" "}
                    {doc.attachments.length === 1 ? "файл" : "файла(ов)"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
