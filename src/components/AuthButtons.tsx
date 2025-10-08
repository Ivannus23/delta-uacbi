import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

export default async function AuthButtons() {
  const session = await auth();

  if (!session?.user) {
    return <Link href="/api/auth/signin" className="underline">Iniciar sesión</Link>;
  }

  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <button className="underline">Cerrar sesión</button>
    </form>
  );
}
