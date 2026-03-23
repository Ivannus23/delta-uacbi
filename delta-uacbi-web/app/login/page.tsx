import { LoginButton } from "@/components/auth/LoginButton";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ redirectTo?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const redirectTo = params.redirectTo || "/semana-cultural";

  return (
    <main className="container py-16">
      <div className="mx-auto max-w-md card-next rounded-3xl p-8">
        <h1 className="text-3xl font-semibold">Iniciar sesion</h1>
        <p className="mt-2 text-muted-foreground">Accede con tu correo institucional.</p>

        <div className="mt-6">
          <LoginButton
            callbackUrl={redirectTo}
            className="btn-sheen w-full rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm hover:bg-white/10"
          />
        </div>
      </div>
    </main>
  );
}
