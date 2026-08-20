import { redirect } from "next/navigation";
import { hasAnyUser } from "@/lib/auth";
import { setupAction } from "./actions";

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await hasAnyUser()) {
    redirect("/login");
  }
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Учёт самозанятого</h1>
          <p className="mt-1 text-sm text-slate-500">
            Создайте личный аккаунт — он будет единственным в этой программе.
          </p>
        </div>
        <form action={setupAction} className="card space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}
          <div>
            <label className="label" htmlFor="name">
              Имя (необязательно)
            </label>
            <input className="input" id="name" name="name" type="text" placeholder="Как к вам обращаться" />
          </div>
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input className="input" id="email" name="email" type="email" required placeholder="you@example.com" />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Пароль
            </label>
            <input className="input" id="password" name="password" type="password" required minLength={6} />
          </div>
          <div>
            <label className="label" htmlFor="confirmPassword">
              Повторите пароль
            </label>
            <input
              className="input"
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={6}
            />
          </div>
          <button type="submit" className="btn-primary w-full">
            Создать аккаунт
          </button>
        </form>
      </div>
    </div>
  );
}
