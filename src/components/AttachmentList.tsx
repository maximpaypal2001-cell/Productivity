import { formatFileSize } from "@/lib/format";
import { ConfirmSubmitButton } from "./ConfirmSubmitButton";

type AttachmentItem = {
  id: string;
  fileName: string;
  size: number;
};

export function AttachmentList({
  attachments,
  onDelete,
}: {
  attachments: AttachmentItem[];
  onDelete?: (attachmentId: string) => Promise<void>;
}) {
  if (attachments.length === 0) {
    return <p className="text-sm text-slate-400">Файлов пока нет.</p>;
  }

  return (
    <ul className="divide-y divide-slate-100">
      {attachments.map((a) => (
        <li key={a.id} className="flex items-center justify-between gap-2 py-2 text-sm">
          <a
            href={`/api/files/${a.id}`}
            target="_blank"
            rel="noreferrer"
            className="truncate text-brand-700 hover:underline"
          >
            {a.fileName}
          </a>
          <div className="flex shrink-0 items-center gap-2 text-xs text-slate-400">
            <span>{formatFileSize(a.size)}</span>
            {onDelete && (
              <form action={onDelete.bind(null, a.id)}>
                <ConfirmSubmitButton confirmMessage="Удалить файл?" className="text-red-500 hover:underline">
                  Удалить
                </ConfirmSubmitButton>
              </form>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
