import Link from "next/link";
import { auth } from "@/lib/auth";
import AuthButtons from "./AuthButtons";

export default async function Header() {
  const session = await auth();
  const role = (session?.user as any)?.role;

  return (
    <header className="border-b">
      <div className="max-w-5xl mx-auto flex items-center justify-between p-4">
        <Link href="/" className="font-semibold">Δ Delta UACBI</Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/projects">Proyectos</Link>
          <Link href="/contests">Concursos</Link>
          <Link href="/notices">Avisos</Link>
          {role === "ADMIN" && <Link href="/admin">Admin</Link>}
          <AuthButtons />
        </nav>
      </div>
    </header>
  );
}
