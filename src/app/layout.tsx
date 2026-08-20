import type { Metadata, Viewport } from "next";
import "./globals.css";

// Every page here reads live session/database state (auth, items, money).
// None of it may be statically prerendered, or a build-time snapshot (e.g.
// "no account yet") gets baked in and served to every visitor afterwards.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Учёт самозанятого",
  description: "Учёт доходов, расходов и документов для самозанятого",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
