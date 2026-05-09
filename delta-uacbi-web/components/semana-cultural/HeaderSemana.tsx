"use client";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getSession, signIn } from "next-auth/react";

const links = [
  { href: "/semana-cultural", label: "Inicio modulo", primary: true },
  { href: "/semana-cultural/mi-equipo", label: "Mi equipo" },
  { href: "/semana-cultural/ranking", label: "Ranking" },
  { href: "/semana-cultural/resultados", label: "Resultados en vivo" },
  { href: "/semana-cultural/staff", label: "Panel staff" },
];

const subtitle = "Registro de equipos, actividades, ranking y resultados en vivo.";

type HeaderSemanaProps = {
  variant?: "hero" | "compact";
};

type LogoCardProps = {
  src: string;
  alt: string;
  main?: boolean;
  hero?: boolean;
};

function isLinkActive(pathname: string, href: string) {
  if (href === "/semana-cultural") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getPillClasses(isActive: boolean, isPrimary = false) {
  const base =
    "inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300/70";

  if (isActive) {
    return `${base} border-white/90 bg-white text-[#0d4b59] shadow-[0_8px_18px_rgba(8,31,59,0.26)]`;
  }

  if (isPrimary) {
    return `${base} border-white/45 bg-white/16 text-white shadow-[0_6px_16px_rgba(8,31,59,0.2)] hover:border-white/70 hover:bg-white/24`;
  }

  return `${base} border-white/28 bg-white/8 text-white hover:border-amber-200/75 hover:bg-white/18`;
}

function HeaderBackground({ hero = false }: { hero?: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(130%_120%_at_0%_0%,rgba(250,204,21,0.25)_0%,transparent_40%),radial-gradient(120%_110%_at_100%_100%,rgba(251,146,60,0.22)_0%,transparent_44%),linear-gradient(118deg,#082c77_0%,#0c5e88_37%,#0f8558_72%,#f0c955_100%)]" />
      <div className={`absolute inset-0 ${hero ? "opacity-12" : "opacity-10"} [background-image:linear-gradient(135deg,rgba(255,255,255,0.38)_1px,transparent_1px)] [background-size:20px_20px]`} />
      <div className="absolute inset-0 opacity-8 [background-image:linear-gradient(38deg,rgba(255,255,255,0.3)_1px,transparent_1px)] [background-size:34px_34px]" />
      <div className="absolute -left-14 top-10 h-28 w-28 rounded-full bg-yellow-200/24 blur-2xl" />
      <div className="absolute left-[42%] top-[-12%] h-36 w-36 rounded-full bg-cyan-300/18 blur-3xl" />
      <div className="absolute right-[8%] top-[10%] h-24 w-24 rounded-full bg-emerald-200/18 blur-2xl" />
      <div className="absolute bottom-[-10%] right-1/3 h-32 w-32 rounded-full bg-pink-300/16 blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(255,255,255,0.22)_0%,transparent_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(0deg,rgba(6,20,52,0.36)_0%,transparent_100%)]" />
      <div className="absolute left-0 top-0 h-full w-1.5 bg-[linear-gradient(180deg,#facc15_0%,#fb7185_52%,#60a5fa_100%)]" />
      <div className="absolute right-0 top-0 h-full w-1.5 bg-[linear-gradient(180deg,#4ade80_0%,#facc15_50%,#38bdf8_100%)]" />
      <span className="absolute left-[8%] top-[22%] h-1.5 w-1.5 rotate-12 rounded-[2px] bg-yellow-200/85" />
      <span className="absolute left-[14%] top-[66%] h-1.5 w-1.5 rotate-45 rounded-[2px] bg-pink-200/70" />
      <span className="absolute left-[31%] top-[26%] h-1.5 w-1.5 -rotate-12 rounded-[2px] bg-sky-200/80" />
      <span className="absolute left-[57%] top-[70%] h-1.5 w-1.5 rotate-45 rounded-[2px] bg-emerald-200/70" />
      <span className="absolute left-[79%] top-[24%] h-1.5 w-1.5 rotate-12 rounded-[2px] bg-orange-200/80" />
      <span className="absolute left-[90%] top-[61%] h-1.5 w-1.5 -rotate-12 rounded-[2px] bg-fuchsia-200/70" />
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

function LogoGroup({ hero = false }: { hero?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center ${hero ? "gap-3.5 sm:gap-4.5" : "gap-3 sm:gap-3.5"}`}>
      <LogoCard src="/CARNAVAL_1.svg" alt="Carnaval Brasileño" main hero={hero} />
      <div className={`flex items-center justify-center ${hero ? "gap-3.5 sm:gap-4" : "gap-3 sm:gap-3.5"}`}>
        <LogoCard src="/PAECOLOR.svg" alt="Proyecto P.A.E" hero={hero} />
        <LogoCard src="/DELTACOLOR_1.svg" alt="Delta UACBI" hero={hero} />
      </div>
    </div>
  );
}

function HeaderNav({
  pathname,
  centered = false,
  hasSession,
}: {
  pathname: string;
  centered?: boolean;
  hasSession: boolean | null;
}) {
  const loginCallbackUrl = pathname || "/semana-cultural";

  return (
    <div className={`flex flex-wrap gap-2.5 ${centered ? "justify-center" : "justify-center lg:justify-start"}`}>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={getPillClasses(isLinkActive(pathname, link.href), Boolean(link.primary))}
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
          className="inline-flex items-center justify-center rounded-full border border-white/22 bg-white/6 px-4 py-2 text-sm font-medium text-white/90 transition hover:border-rose-200/60 hover:bg-white/14 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300/70"
        />
      ) : (
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: loginCallbackUrl })}
          className="inline-flex items-center justify-center rounded-full border border-white/22 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:border-emerald-200/70 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300/70"
        >
          Iniciar sesion
        </button>
      )}
    </div>
  );
}

export function HeaderSemana({ variant = "compact" }: HeaderSemanaProps) {
  const pathname = usePathname() ?? "";
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
        <HeaderBackground hero />

        <div className="relative px-5 py-7 sm:px-8 sm:py-9 lg:px-11 lg:py-10">
          <div className="flex flex-col items-center gap-5 text-center lg:items-start lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/34 bg-black/12 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/95">
              <span className="h-2 w-2 rounded-full bg-yellow-300" />
              Carnaval Brasileño
            </span>

            <LogoGroup hero />

            <div className="max-w-4xl">
              <h1 className="text-[2.05rem] font-semibold leading-tight text-white sm:text-[2.7rem] lg:text-[3.1rem]">
                Semana Cultural UAE × UACBI
              </h1>
              <p className="mt-3 text-sm leading-6 text-white/92 sm:text-base sm:leading-7">{subtitle}</p>
            </div>
          </div>

          <div className="mt-7 border-t border-white/22 pt-5">
            <HeaderNav pathname={pathname} hasSession={hasSession} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mb-6 overflow-hidden rounded-[1.45rem] border border-white/24 shadow-[0_14px_34px_rgba(7,24,54,0.22)]">
      <HeaderBackground />

      <div className="relative px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/32 bg-black/12 px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/95">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-300" />
            Carnaval Brasileño
          </span>

          <LogoGroup />

          <div className="min-w-0">
            <h1 className="text-2xl font-semibold leading-tight text-white sm:text-[1.95rem]">Semana Cultural UAE × UACBI</h1>
            <p className="mt-1 text-sm leading-6 text-white/90">{subtitle}</p>
          </div>
        </div>

        <div className="mt-4 border-t border-white/22 pt-4">
          <HeaderNav pathname={pathname} centered hasSession={hasSession} />
        </div>
      </div>
    </div>
  );
}
