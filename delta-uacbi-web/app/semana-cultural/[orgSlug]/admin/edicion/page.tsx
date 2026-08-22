import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeaderSemana, type EditionLogo } from "@/components/semana-cultural/HeaderSemana";
import { requireOrgAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { resolveOrganization, getActiveEdition } from "@/lib/semana-cultural";
import { ACADEMIC_UNITS } from "@/lib/academic-catalog";
import { updateEditionTheme, updateEditionRegistrationFee } from "./actions";

export const revalidate = 0;

function parsePartnerLogos(value: unknown): EditionLogo[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is EditionLogo =>
        Boolean(item) && typeof item === "object" && typeof (item as Record<string, unknown>).url === "string"
    )
    .map((item) => ({ url: item.url, alt: typeof item.alt === "string" ? item.alt : "" }));
}

export default async function AdminEdicionPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const organization = await resolveOrganization(orgSlug);
  await requireOrgAdmin(organization.id);

  const edition = await getActiveEdition(organization.id);
  const logos = edition ? parsePartnerLogos(edition.partnerLogos) : [];
  const logoSlots = [0, 1, 2, 3].map((index) => logos[index] ?? { url: "", alt: "" });
  const mpAccount = await db.organizationMercadoPagoAccount.findUnique({
    where: { organizationId: organization.id },
  });

  return (
    <>
      <Navbar />
      <main className="container py-10">
        <HeaderSemana orgSlug={orgSlug} edition={edition ?? undefined} />

        <section className="card-next rounded-3xl p-6">
          <h2 className="text-2xl font-semibold">Tema visual de la edición</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Personaliza el banner, el logo de la semana cultural y el/los logo(s) de la o las unidades
            académicas participantes. Por ahora se configuran pegando una URL de imagen (no hay carga
            de archivos todavía).
          </p>

          {!edition ? (
            <p className="mt-4 text-sm text-amber-300">Esta organización no tiene una edición activa.</p>
          ) : (
            <form action={updateEditionTheme.bind(null, organization.id, orgSlug)} className="mt-6 grid gap-6">
              <div>
                <label className="mb-2 block text-sm text-muted-foreground">
                  Unidad(es) académica(s) organizadora(s)
                </label>
                <p className="mb-2 text-xs text-muted-foreground">
                  Selecciona una o varias si la edición es conjunta entre unidades.
                </p>
                <div className="max-h-56 overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {ACADEMIC_UNITS.map((unit) => (
                      <label key={unit.code} className="flex items-start gap-2 text-sm">
                        <input
                          type="checkbox"
                          name="organizingUnitCodes"
                          value={unit.code}
                          defaultChecked={edition.organizingUnitCodes.includes(unit.code)}
                          className="mt-1"
                        />
                        <span>{unit.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-muted-foreground">
                    Nombre corto del tema (badge)
                  </label>
                  <input
                    name="themeName"
                    defaultValue={edition.themeName ?? ""}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                    placeholder="Ej. Carnaval Brasileño"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-muted-foreground">
                    URL del banner (imagen de fondo del hero)
                  </label>
                  <input
                    name="bannerImageUrl"
                    defaultValue={edition.bannerImageUrl ?? ""}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                    placeholder="https://.../banner.jpg"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-muted-foreground">Subtítulo</label>
                <input
                  name="subtitle"
                  defaultValue={edition.subtitle ?? ""}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                  placeholder="Registro de equipos, actividades, ranking y resultados en vivo."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-muted-foreground">
                  URL del logo de la semana cultural (logo principal)
                </label>
                <input
                  name="eventLogoUrl"
                  defaultValue={edition.eventLogoUrl ?? ""}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                  placeholder="https://.../logo-evento.svg"
                />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Logo(s) de unidad académica participante — usa varias filas si la edición es conjunta
                  entre dos o más unidades.
                </p>
                <div className="mt-3 grid gap-3">
                  {logoSlots.map((logo, index) => (
                    <div key={index} className="grid gap-3 sm:grid-cols-[2fr_1fr]">
                      <input
                        name={`logo${index + 1}Url`}
                        defaultValue={logo.url}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                        placeholder={`URL del logo ${index + 1} (opcional)`}
                      />
                      <input
                        name={`logo${index + 1}Alt`}
                        defaultValue={logo.alt}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                        placeholder="Texto alternativo (nombre de la unidad)"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="btn-sheen w-fit rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm hover:bg-white/10"
              >
                Guardar tema
              </button>
            </form>
          )}
        </section>

        {edition ? (
          <section className="card-next mt-6 rounded-3xl p-6">
            <h2 className="text-2xl font-semibold">Cuota de inscripción</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Si activas cuota fija, el dinero llega directo a la cuenta de Mercado Pago de esta
              organización (conéctala primero en{" "}
              <a href={`/semana-cultural/${orgSlug}/admin/pagos`} className="underline">
                Pagos
              </a>
              ) — la plataforma nunca lo recibe.
            </p>

            {!mpAccount ? (
              <p className="mt-4 text-sm text-amber-300">
                Esta organización todavía no conectó su cuenta de Mercado Pago
                {process.env.NODE_ENV === "production"
                  ? ", así que solo puede usar el modo gratis."
                  : " — fuera de producción puedes activar la cuota fija de todos modos para probar con el botón de pago simulado."}
              </p>
            ) : null}

            <form
              action={updateEditionRegistrationFee.bind(null, organization.id, orgSlug)}
              className="mt-6 grid gap-4 sm:grid-cols-2"
            >
              <div>
                <label className="mb-2 block text-sm text-muted-foreground">Modo</label>
                <select
                  name="registrationFeeMode"
                  defaultValue={edition.registrationFeeMode}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                >
                  <option value="FREE">Gratis</option>
                  <option value="FIXED" disabled={!mpAccount && process.env.NODE_ENV === "production"}>
                    Cuota fija por equipo
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-muted-foreground">
                  Monto (solo si el modo es cuota fija)
                </label>
                <input
                  type="number"
                  name="registrationFeeAmount"
                  step="0.01"
                  min="0"
                  defaultValue={edition.registrationFeeAmount ? Number(edition.registrationFeeAmount) : ""}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                  placeholder="Ej. 250.00"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="btn-sheen w-fit rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm hover:bg-white/10"
                >
                  Guardar cuota
                </button>
              </div>
            </form>
          </section>
        ) : null}
      </main>
      <Footer />
    </>
  );
}
