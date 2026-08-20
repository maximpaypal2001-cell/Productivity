import { redirect } from "next/navigation";
import { getCurrentUser, hasAnyUser } from "@/lib/auth";

export default async function RootPage() {
  if (!(await hasAnyUser())) {
    redirect("/setup");
  }
  const user = await getCurrentUser();
  redirect(user ? "/dashboard" : "/login");
}
