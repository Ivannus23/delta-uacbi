import "./globals.css";
import { inter, space } from "./fonts";
import Link from "next/link";
import AuthButtons from "@/components/AuthButtons";

export const metadata = {
  title: "Delta UACBI",
  description: "Repositorio de proyectos, concursos y avisos - Delta UACBI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} min-h-screen`}>
        <header className="border-b bg-white">
          <nav className="container flex items-center justify-between py-4">
            <Link href="/" className="font-bold text-xl">Δ Delta UACBI</Link>
            <AuthButtons />   {/* ← aquí va */}
          </nav>
        </header>

        <main className="container py-8">{children}</main>

        <footer className="border-t py-6 text-sm text-neutral-600 container">
          © {new Date().getFullYear()} Delta UACBI — Hecho con Next.js + Prisma
        </footer>
      </body>
    </html>
  );
}
