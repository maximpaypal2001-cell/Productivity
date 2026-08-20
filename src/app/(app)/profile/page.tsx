import { requireUser } from "@/lib/auth";
import { changePassword, updateProfile } from "./actions";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const user = await requireUser();
  const { error, saved } = await searchParams;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Профиль</h1>

      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {saved && <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Сохранено.</div>}

      <div className="card space-y-4">
        <h2 className="font-semibold text-slate-900">Основные данные</h2>
        <p className="text-sm text-slate-500">Email: {user.email}</p>
        <form action={updateProfile} className="space-y-4">
          <div>
            <label className="label" htmlFor="name">
              Имя
            </label>
            <input className="input" id="name" name="name" defaultValue={user.name ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="taxRatePercent">
              Ставка налога для оценки, % *
            </label>
            <input
              className="input max-w-[150px]"
              id="taxRatePercent"
              name="taxRatePercent"
              type="number"
              step="0.1"
              min="0"
              max="100"
              required
              defaultValue={user.taxRatePercent}
            />
            <p className="mt-1 text-xs text-slate-500">
              Для самозанятых в РФ обычно 4% при продаже физлицам и 6% — юрлицам/ИП. Используется только для
              приблизительного расчёта в отчётах.
            </p>
          </div>
          <button type="submit" className="btn-primary">
            Сохранить
          </button>
        </form>
      </div>

      <div className="card space-y-4">
        <h2 className="font-semibold text-slate-900">Смена пароля</h2>
        <form action={changePassword} className="space-y-4">
          <div>
            <label className="label" htmlFor="currentPassword">
              Текущий пароль
            </label>
            <input className="input" id="currentPassword" name="currentPassword" type="password" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="newPassword">
                Новый пароль
              </label>
              <input className="input" id="newPassword" name="newPassword" type="password" required minLength={6} />
            </div>
            <div>
              <label className="label" htmlFor="confirmNewPassword">
                Повторите новый пароль
              </label>
              <input
                className="input"
                id="confirmNewPassword"
                name="confirmNewPassword"
                type="password"
                required
                minLength={6}
              />
            </div>
          </div>
          <button type="submit" className="btn-primary">
            Изменить пароль
          </button>
        </form>
      </div>
    </div>
  );
}
