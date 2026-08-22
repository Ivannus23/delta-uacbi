"use client";

import { useMemo, useState } from "react";
import type { AcademicUnit } from "@/lib/academic-catalog";

export type UnitOption = AcademicUnit;

type RegistroUnidadProgramaFieldProps = {
  units: UnitOption[];
  unidadName: string;
  programName: string;
  unidadLabel?: string;
  programLabel?: string;
  defaultUnitCode?: string;
};

export function RegistroUnidadProgramaField({
  units,
  unidadName,
  programName,
  unidadLabel = "Unidad academica",
  programLabel = "Carrera / programa educativo",
  defaultUnitCode,
}: RegistroUnidadProgramaFieldProps) {
  const [unitCode, setUnitCode] = useState(defaultUnitCode ?? units[0]?.code ?? "");
  const selectedUnit = useMemo(
    () => units.find((unit) => unit.code === unitCode) ?? null,
    [units, unitCode]
  );
  const programs = selectedUnit?.programs ?? [];

  if (!units.length) {
    return (
      <div className="sm:col-span-2 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">
        El organizador aún no configuró unidades académicas para esta edición.
      </div>
    );
  }

  return (
    <>
      <div>
        <label className="mb-2 block text-sm text-muted-foreground">{unidadLabel}</label>
        <select
          name={unidadName}
          value={unitCode}
          onChange={(event) => setUnitCode(event.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
          required
        >
          {units.map((unit) => (
            <option key={unit.code} value={unit.code}>
              {unit.label}
            </option>
          ))}
        </select>
      </div>

      <div key={unitCode}>
        <label className="mb-2 block text-sm text-muted-foreground">{programLabel}</label>
        {programs.length <= 1 ? (
          <>
            <input type="hidden" name={programName} value={programs[0]?.code ?? ""} />
            <div className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground">
              {programs[0]?.label ?? "Sin carreras configuradas"}
            </div>
          </>
        ) : (
          <select
            name={programName}
            defaultValue={programs[0]?.code ?? ""}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
            required
          >
            {programs.map((program) => (
              <option key={program.code} value={program.code}>
                {program.label}
              </option>
            ))}
          </select>
        )}
      </div>
    </>
  );
}
