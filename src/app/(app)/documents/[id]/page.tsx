import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toDateInputValue } from "@/lib/format";
import { AttachmentList } from "@/components/AttachmentList";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { deleteDocument, deleteDocumentAttachment, updateDocument } from "../actions";

export default async function DocumentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { error } = await searchParams;

  const document = await prisma.document.findFirst({
    where: { id, userId: user.id },
    include: { attachments: true },
  });
  if (!document) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/documents" className="hover:underline">
          Документы
        </Link>
        <span>/</span>
        <span className="truncate">{document.title}</span>
      </div>

      <div className="flex items-start justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900">{document.title}</h1>
        <form action={deleteDocument.bind(null, document.id)}>
          <ConfirmSubmitButton confirmMessage="Удалить документ вместе с файлами?" className="btn-danger">
            Удалить
          </ConfirmSubmitButton>
        </form>
      </div>

      <div className="card space-y-4">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <form action={updateDocument.bind(null, document.id)} encType="multipart/form-data" className="space-y-4">
          <div>
            <label className="label" htmlFor="title">
              Название *
            </label>
            <input className="input" id="title" name="title" required defaultValue={document.title} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="category">
                Категория
              </label>
              <input className="input" id="category" name="category" defaultValue={document.category ?? ""} />
            </div>
            <div>
              <label className="label" htmlFor="date">
                Дата документа
              </label>
              <input
                className="input"
                id="date"
                name="date"
                type="date"
                defaultValue={document.date ? toDateInputValue(document.date) : ""}
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="notes">
              Заметки
            </label>
            <textarea className="textarea" id="notes" name="notes" defaultValue={document.notes ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="files">
              Добавить файл
            </label>
            <input className="input" id="files" name="files" type="file" multiple accept="image/*,.pdf,.doc,.docx" />
          </div>
          <button type="submit" className="btn-primary">
            Сохранить изменения
          </button>
        </form>
        <div className="border-t border-slate-100 pt-3">
          <p className="label">Файлы</p>
          <AttachmentList
            attachments={document.attachments}
            onDelete={deleteDocumentAttachment.bind(null, document.id)}
          />
        </div>
      </div>
    </div>
  );
}
