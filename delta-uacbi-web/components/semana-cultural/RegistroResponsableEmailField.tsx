"use client";

import Link from "next/link";
import { useState } from "react";

type RegistroResponsableEmailFieldProps = {
  defaultValue?: string;
  isAuthenticated: boolean;
};

export function RegistroResponsableEmailField({
  defaultValue = "",
  isAuthenticated,
}: RegistroResponsableEmailFieldProps) {
  const [email, setEmail] = useState(defaultValue);

  return (
    <div className="sm:col-span-2">
      <label className="mb-2 block text-sm text-muted-foreground">Correo del responsable</label>
      <input
        type="email"
        name="responsableCorreo"
        defaultValue={defaultValue}
        onChange={(event) => setEmail(event.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
        placeholder="correo@ejemplo.com"
        required
      />

      {isAuthenticated ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Este equipo se vinculara automaticamente con tu cuenta de Google.
        </p>
      ) : email.trim() ? (
        <div className="mt-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
          <p className="text-sm text-emerald-100">
            Si este correo sera el del jefe de grupo, inicia sesion con Google para que el equipo
            quede vinculado a tu cuenta.
          </p>
          <Link
            href="/login?redirectTo=/semana-cultural/registro"
            className="mt-3 inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-foreground hover:bg-white/10"
          >
            Iniciar sesion con Google
          </Link>
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          Si inicias sesion con tu correo institucional antes de registrar el equipo, quedara
          vinculado a tu cuenta.
        </p>
      )}
    </div>
  );
}
