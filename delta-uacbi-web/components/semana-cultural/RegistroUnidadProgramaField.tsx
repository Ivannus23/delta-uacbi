"use client";

import { useMemo, useState } from "react";

const UAE_PROGRAM_VALUE = "LICENCIATURA_ENFERMERIA";

const UACBI_PROGRAM_OPTIONS = [
  { value: "INGENIERIA_MECANICA", label: "Ingenieria Mecanica" },
  {
    value: "INGENIERIA_CONTROL_COMPUTACION",
    label: "Ingenieria en Control y Computacion",
  },
  { value: "LICENCIATURA_MATEMATICAS", label: "Licenciatura en Matematicas" },
  { value: "INGENIERIA_QUIMICA", label: "Ingenieria Quimica" },
  { value: "INGENIERIA_ELECTRONICA", label: "Ingenieria Electronica" },
] as const;

type RegistroUnidadProgramaFieldProps = {
  unidadName: string;
  programName: string;
  unidadLabel?: string;
  programLabel?: string;
  defaultUnidad?: "UAE" | "UACBI";
};

export function RegistroUnidadProgramaField({
  unidadName,
  programName,
  unidadLabel = "Unidad academica",
  programLabel = "Carrera / programa educativo",
  defaultUnidad = "UAE",
}: RegistroUnidadProgramaFieldProps) {
  const [unidadAcademica, setUnidadAcademica] = useState<"UAE" | "UACBI">(defaultUnidad);

  const defaultProgram = useMemo(
    () => UACBI_PROGRAM_OPTIONS[0]?.value ?? "INGENIERIA_MECANICA",
    []
  );

  return (
    <>
      <div>
        <label className="mb-2 block text-sm text-muted-foreground">{unidadLabel}</label>
        <select
          name={unidadName}
          value={unidadAcademica}
          onChange={(event) => setUnidadAcademica(event.target.value as "UAE" | "UACBI")}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
          required
        >
          <option value="UAE">UAE</option>
          <option value="UACBI">UACBI</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm text-muted-foreground">{programLabel}</label>
        {unidadAcademica === "UAE" ? (
          <>
            <input type="hidden" name={programName} value={UAE_PROGRAM_VALUE} />
            <div className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground">
              Licenciatura en Enfermeria
            </div>
          </>
        ) : (
          <select
            name={programName}
            defaultValue={defaultProgram}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
            required
          >
            {UACBI_PROGRAM_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>
    </>
  );
}
