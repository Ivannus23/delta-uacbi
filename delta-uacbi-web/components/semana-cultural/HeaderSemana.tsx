"use client";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { formatOrganizingUnitsLabel } from "@/lib/academic-catalog";

function getLinks(orgBase: string) {
  return [
    { href: orgBase, label: "Inicio modulo", primary: true },
    { href: `${orgBase}/mi-equipo`, label: "Mi equipo" },
    { href: `${orgBase}/ranking`, label: "Ranking" },
    { href: `${orgBase}/resultados`, label: "Resultados en vivo" },
    { href: `${orgBase}/staff`, label: "Panel staff" },
  ];
}

const DEFAULT_SUBTITLE = "Registro de equipos, actividades, ranking y resultados en vivo.";

export type EditionLogo = { url: string; alt: string };

export type EditionTheme = {
  name: string;
  themeName?: string | null;
  subtitle?: string | null;
  bannerImageUrl?: string | null;
  eventLogoUrl?: string | null;
  partnerLogos?: unknown;
  organizingUnitCodes?: string[] | null;
};

type HeaderSemanaProps = {
  variant?: "hero" | "compact";
  orgSlug: string;
  edition?: EditionTheme | null;
};

type LogoCardProps = {
  src: string;
  alt: string;
  main?: boolean;
  hero?: boolean;
};

function parsePartnerLogos(value: unknown): EditionLogo[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is EditionLogo =>
        Boolean(item) &&
        typeof item === "object" &&
        typeof (item as Record<string, unknown>).url === "string"
    )
    .map((item) => ({ url: item.url, alt: typeof item.alt === "string" ? item.alt : "" }));
}

function isLinkActive(pathname: string, href: string, orgBase: string) {
  if (href === orgBase) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getPillClasses(isActive: boolean, isPrimary = false) {
  const base =
    "inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70";

  if (isActive) {
    return `${base} border-white/90 bg-white text-[#0d4b59] shadow-[0_8px_18px_rgba(8,31,59,0.26)]`;
  }

  if (isPrimary) {
    return `${base} border-white/45 bg-white/16 text-white shadow-[0_6px_16px_rgba(8,31,59,0.2)] hover:border-white/70 hover:bg-white/24`;
  }

  return `${base} border-white/28 bg-white/8 text-white hover:border-white/60 hover:bg-white/18`;
}

function HeaderBackground({ hero = false, bannerImageUrl }: { hero?: boolean; bannerImageUrl?: string | null }) {
  if (bannerImageUrl) {
    return (
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <Image src={bannerImageUrl} alt="" fill priority className="object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,12,28,0.45)_0%,rgba(6,12,28,0.65)_100%)]" />
      </div>
    );
  }

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(130%_120%_at_0%_0%,rgba(10,117,124,0.35)_0%,transparent_45%),radial-gradient(120%_110%_at_100%_100%,rgba(192,35,100,0.28)_0%,transparent_48%),linear-gradient(118deg,#0f4950_0%,#0a757c_45%,#442776_100%)]" />
      <div className={`absolute inset-0 ${hero ? "opacity-12" : "opacity-10"} [background-image:linear-gradient(135deg,rgba(255,255,255,0.32)_1px,transparent_1px)] [background-size:20px_20px]`} />
      <div className="absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(255,255,255,0.16)_0%,transparent_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(0deg,rgba(6,20,52,0.36)_0%,transparent_100%)]" />
      <div className="absolute left-0 top-0 h-full w-1.5 bg-[linear-gradient(180deg,#0a757c_0%,#442776_50%,#c02364_100%)]" />
      <div className="absolute right-0 top-0 h-full w-1.5 bg-[linear-gradient(180deg,#95c11f_0%,#e28c22_50%,#0a757c_100%)]" />
    </div>
  );
}

function LogoCard({ src, alt, main = false, hero = false }: LogoCardProps) {
  const shell = main
    ? hero
      ? "h-[6.3rem] w-[6.3rem] rounded-[1.45rem] sm:h-[6.9rem] sm:w-[6.9rem]"
      : "h-[5.2rem] w-[5.2rem] rounded-[1.25rem] sm:h-[5.6rem] sm:w-[5.6rem]"
    : hero
      ? "h-[5.8rem] w-[5.8rem] rounded-[1.2rem] sm:h-[6.2rem] sm:w-[6.2rem]"
      : "h-[4.8rem] w-[4.8rem] rounded-[1.1rem] sm:h-[5.1rem] sm:w-[5.1rem]";

  const logo = main
    ? hero
      ? "h-[5rem] w-[5rem] sm:h-[5.45rem] sm:w-[5.45rem]"
      : "h-[4rem] w-[4rem] sm:h-[4.25rem] sm:w-[4.25rem]"
    : hero
      ? "h-[4.4rem] w-[4.4rem] sm:h-[4.75rem] sm:w-[4.75rem]"
      : "h-[3.6rem] w-[3.6rem] sm:h-[3.85rem] sm:w-[3.85rem]";

  return (
    <div className={`relative grid shrink-0 place-items-center ${shell}`}>
      <span
        aria-hidden
        className="absolute inset-0 rounded-[inherit] border border-white/40 bg-white/14 shadow-[0_8px_20px_rgba(7,26,56,0.2)] backdrop-blur-[3px]"
      />
      <span
        aria-hidden
        className="absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.56)_0%,rgba(255,255,255,0.12)_50%,rgba(255,255,255,0)_100%)]"
      />
      <Image
        src={src}
        alt={alt}
        width={72}
        height={72}
        className={`relative object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.28)] ${logo}`}
      />
    </div>
  );
}

function LogoGroup({
  hero = false,
  eventLogoUrl,
  partnerLogos,
}: {
  hero?: boolean;
  eventLogoUrl?: string | null;
  partnerLogos: EditionLogo[];
}) {
  if (!eventLogoUrl && !partnerLogos.length) {
    return null;
  }

  return (
    <div className={`flex flex-col items-center justify-center ${hero ? "gap-3.5 sm:gap-4.5" : "gap-3 sm:gap-3.5"}`}>
      {eventLogoUrl ? <LogoCard src={eventLogoUrl} alt="Logo de la edición" main hero={hero} /> : null}
      {partnerLogos.length ? (
        <div className={`flex flex-wrap items-center justify-center ${hero ? "gap-3.5 sm:gap-4" : "gap-3 sm:gap-3.5"}`}>
          {partnerLogos.map((logo) => (
            <LogoCard key={logo.url} src={logo.url} alt={logo.alt} hero={hero} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function HeaderNav({
  pathname,
  centered = false,
  hasSession,
  orgBase,
}: {
  pathname: string;
  centered?: boolean;
  hasSession: boolean | null;
  orgBase: string;
}) {
  const loginCallbackUrl = pathname || orgBase;
  const links = getLinks(orgBase);

  return (
    <div className={`flex flex-wrap gap-2.5 ${centered ? "justify-center" : "justify-center lg:justify-start"}`}>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={getPillClasses(isLinkActive(pathname, link.href, orgBase), Boolean(link.primary))}
        >
          {link.label}
        </Link>
      ))}

      {hasSession === null ? (
        <button
          type="button"
          disabled
          className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/6 px-4 py-2 text-sm font-medium text-white/70 transition"
        >
          Cargando...
        </button>
      ) : hasSession ? (
        <LogoutButton
          callbackUrl="/"
          className="inline-flex items-center justify-center rounded-full border border-white/22 bg-white/6 px-4 py-2 text-sm font-medium text-white/90 transition hover:border-rose-200/60 hover:bg-white/14 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
        />
      ) : (
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: loginCallbackUrl })}
          className="inline-flex items-center justify-center rounded-full border border-white/22 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:border-emerald-200/70 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
        >
          Iniciar sesion
        </button>
      )}
    </div>
  );
}

export function HeaderSemana({ variant = "compact", orgSlug, edition }: HeaderSemanaProps) {
  const pathname = usePathname() ?? "";
  const orgBase = `/semana-cultural/${orgSlug}`;
  const title = edition?.name || "Semana Cultural";
  const subtitle = edition?.subtitle || DEFAULT_SUBTITLE;
  const themeName = edition?.themeName || null;
  const bannerImageUrl = edition?.bannerImageUrl || null;
  const eventLogoUrl = edition?.eventLogoUrl || null;
  const partnerLogos = parsePartnerLogos(edition?.partnerLogos);
  const organizingUnitsLabel = formatOrganizingUnitsLabel(edition?.organizingUnitCodes);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;

    getSession()
      .then((session) => {
        if (!active) return;
        setHasSession(Boolean(session));
      })
      .catch(() => {
        if (!active) return;
        setHasSession(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (variant === "hero") {
    return (
      <div className="relative mb-8 overflow-hidden rounded-[1.9rem] border border-white/24 shadow-[0_20px_58px_rgba(8,24,52,0.28)]">
        <HeaderBackground hero bannerImageUrl={bannerImageUrl} />

        <div className="relative px-5 py-7 sm:px-8 sm:py-9 lg:px-11 lg:py-10">
          <div className="flex flex-col items-center gap-5 text-center lg:items-start lg:text-left">
            {themeName ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/34 bg-black/12 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/95">
                <span className="h-2 w-2 rounded-full bg-accent" />
                {themeName}
              </span>
            ) : null}

            <LogoGroup hero eventLogoUrl={eventLogoUrl} partnerLogos={partnerLogos} />

            <div className="max-w-4xl">
              <h1 className="text-[2.05rem] font-semibold leading-tight text-white sm:text-[2.7rem] lg:text-[3.1rem]">
                {title}
              </h1>
              <p className="mt-3 text-sm leading-6 text-white/92 sm:text-base sm:leading-7">{subtitle}</p>
              {organizingUnitsLabel ? (
                <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-white/70">
                  Organiza: {organizingUnitsLabel}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-7 border-t border-white/22 pt-5">
            <HeaderNav pathname={pathname} hasSession={hasSession} orgBase={orgBase} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mb-6 overflow-hidden rounded-[1.45rem] border border-white/24 shadow-[0_14px_34px_rgba(7,24,54,0.22)]">
      <HeaderBackground bannerImageUrl={bannerImageUrl} />

      <div className="relative px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex flex-col items-center gap-3 text-center">
          {themeName ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-white/32 bg-black/12 px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/95">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {themeName}
            </span>
          ) : null}

          <LogoGroup eventLogoUrl={eventLogoUrl} partnerLogos={partnerLogos} />

          <div className="min-w-0">
            <h1 className="text-2xl font-semibold leading-tight text-white sm:text-[1.95rem]">{title}</h1>
            <p className="mt-1 text-sm leading-6 text-white/90">{subtitle}</p>
            {organizingUnitsLabel ? (
              <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-white/65">
                Organiza: {organizingUnitsLabel}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-4 border-t border-white/22 pt-4">
          <HeaderNav pathname={pathname} centered hasSession={hasSession} orgBase={orgBase} />
        </div>
      </div>
    </div>
  );
}
