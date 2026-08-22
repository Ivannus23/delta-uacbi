"use client";

import { FormEvent, useActionState, useMemo, useRef, useState } from "react";
import type { UnitOption } from "./RegistroUnidadProgramaField";

type MemberDraft = {
  fullName: string;
  matricula: string;
  institutionalEmail: string;
  gradoGrupo: string;
  academicUnitCode: string;
  academicProgramCode: string;
};

type MembersSpreadsheetProps = {
  units: UnitOption[];
  remainingSlots: number;
  maxTeamMembers: number;
  action: (
    prevState: { status: "idle" | "success" | "error"; message: string },
    formData: FormData
  ) => Promise<{ status: "idle" | "success" | "error"; message: string }>;
};

const EMAIL_REGEX = /^[a-z0-9._%+-]+@uan\.edu\.mx$/i;

const INITIAL_SUBMIT_STATE = {
  status: "idle" as const,
  message: "",
};

function normalizeDuplicateValues(values: Iterable<string>) {
  return Array.from(new Set(Array.from(values).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "es", { sensitivity: "base" })
  );
}

function formatMatriculaDuplicateInCaptureMessage(values: Iterable<string>) {
  const normalized = normalizeDuplicateValues(values);
  if (!normalized.length) return null;
  return normalized.length === 1
    ? `La matricula ${normalized[0]} esta duplicada en la captura.`
    : `Las matriculas ${normalized.join(", ")} estan duplicadas en la captura.`;
}

function formatEmailDuplicateInCaptureMessage(values: Iterable<string>) {
  const normalized = normalizeDuplicateValues(values);
  if (!normalized.length) return null;
  return normalized.length === 1
    ? `El correo ${normalized[0]} esta duplicado en la captura.`
    : `Los correos ${normalized.join(", ")} estan duplicados en la captura.`;
}

export function MembersSpreadsheet({ units, remainingSlots, maxTeamMembers, action }: MembersSpreadsheetProps) {
  const defaultUnit = units[0];
  const defaultProgram = defaultUnit?.programs[0];

  const createEmptyRows = useMemo(
    () =>
      (count: number): MemberDraft[] =>
        Array.from({ length: count }, () => ({
          fullName: "",
          matricula: "",
          institutionalEmail: "",
          gradoGrupo: "",
          academicUnitCode: defaultUnit?.code ?? "",
          academicProgramCode: defaultProgram?.code ?? "",
        })),
    [defaultUnit, defaultProgram]
  );

  const [rows, setRows] = useState<MemberDraft[]>(() => createEmptyRows(remainingSlots));
  const hiddenPayloadRef = useRef<HTMLInputElement>(null);
  const [pasteText, setPasteText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [submitState, submitAction, isSubmitting] = useActionState(action, INITIAL_SUBMIT_STATE);

  const unitsByCode = useMemo(() => new Map(units.map((unit) => [unit.code, unit])), [units]);
  const unitsByLabel = useMemo(
    () => new Map(units.map((unit) => [unit.label.toLowerCase(), unit])),
    [units]
  );

  function getProgramsForUnit(unitCode: string) {
    return unitsByCode.get(unitCode)?.programs ?? [];
  }

  function updateRow(index: number, patch: Partial<MemberDraft>) {
    setRows((currentRows) =>
      currentRows.map((row, rowIndex) => {
        if (rowIndex !== index) return row;

        const nextUnitCode = patch.academicUnitCode ?? row.academicUnitCode;
        const programsForUnit = getProgramsForUnit(nextUnitCode);
        const requestedProgramCode = patch.academicProgramCode ?? row.academicProgramCode;
        const nextProgramCode = programsForUnit.some((program) => program.code === requestedProgramCode)
          ? requestedProgramCode
          : (programsForUnit[0]?.code ?? "");

        return {
          ...row,
          ...patch,
          academicUnitCode: nextUnitCode,
          academicProgramCode: nextProgramCode,
        };
      })
    );
  }

  function applyPastedGrid(rawText: string) {
    const lines = rawText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (!lines.length) return;

    let hadUnmatchedLabels = false;

    setRows((currentRows) => {
      const nextRows = [...currentRows];

      for (let index = 0; index < Math.min(lines.length, nextRows.length); index += 1) {
        const columns = lines[index].split("\t");
        const unitRaw = String(columns[4] ?? "").trim();
        const programRaw = String(columns[5] ?? "").trim();

        const matchedUnit = unitsByLabel.get(unitRaw.toLowerCase()) ?? defaultUnit ?? null;
        if (!matchedUnit || matchedUnit.label.toLowerCase() !== unitRaw.toLowerCase()) {
          hadUnmatchedLabels = true;
        }

        const matchedProgram =
          matchedUnit?.programs.find((program) => program.label.toLowerCase() === programRaw.toLowerCase()) ??
          matchedUnit?.programs[0] ??
          null;

        nextRows[index] = {
          fullName: String(columns[0] ?? "").trim(),
          matricula: String(columns[1] ?? "").trim(),
          institutionalEmail: String(columns[2] ?? "").trim().toLowerCase(),
          gradoGrupo: String(columns[3] ?? "").trim(),
          academicUnitCode: matchedUnit?.code ?? "",
          academicProgramCode: matchedProgram?.code ?? "",
        };
      }

      return nextRows;
    });

    setWarningMessage(
      hadUnmatchedLabels
        ? "Algunas filas tenian una unidad o carrera que no coincide exactamente con el catalogo; revisa esas filas."
        : null
    );
    setErrorMessage(null);
  }

  function normalizeForSubmit() {
    const payload = rows
      .map((row) => ({
        fullName: row.fullName.trim(),
        matricula: row.matricula.trim(),
        institutionalEmail: row.institutionalEmail.trim().toLowerCase(),
        gradoGrupo: row.gradoGrupo.trim(),
        academicUnitCode: row.academicUnitCode,
        academicProgramCode: row.academicProgramCode,
      }))
      .filter((row) => Boolean(row.fullName || row.matricula || row.institutionalEmail || row.gradoGrupo));

    if (!payload.length) {
      throw new Error("No hay integrantes para guardar.");
    }

    const matriculas = new Set<string>();
    const emails = new Set<string>();
    const duplicateMatriculas = new Set<string>();
    const duplicateEmails = new Set<string>();

    for (const row of payload) {
      if (
        !row.fullName ||
        !row.matricula ||
        !row.institutionalEmail ||
        !row.gradoGrupo ||
        !row.academicUnitCode ||
        !row.academicProgramCode
      ) {
        throw new Error("Completa todos los campos de las filas capturadas o borra la fila.");
      }

      if (!EMAIL_REGEX.test(row.institutionalEmail)) {
        throw new Error("Todos los correos deben terminar en @uan.edu.mx.");
      }

      const matriculaKey = row.matricula.toUpperCase();
      const emailKey = row.institutionalEmail.toLowerCase();

      if (matriculas.has(matriculaKey)) duplicateMatriculas.add(row.matricula);
      if (emails.has(emailKey)) duplicateEmails.add(row.institutionalEmail);

      matriculas.add(matriculaKey);
      emails.add(emailKey);
    }

    const duplicateMessages = [
      formatMatriculaDuplicateInCaptureMessage(duplicateMatriculas),
      formatEmailDuplicateInCaptureMessage(duplicateEmails),
    ].filter((message): message is string => Boolean(message));

    if (duplicateMessages.length) {
      throw new Error(duplicateMessages.join(" "));
    }

    return payload;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    try {
      const payload = normalizeForSubmit();
      if (hiddenPayloadRef.current) {
        hiddenPayloadRef.current.value = JSON.stringify(payload);
      }
      setErrorMessage(null);
    } catch (error) {
      event.preventDefault();
      setErrorMessage(error instanceof Error ? error.message : "No se pudo validar la captura.");
    }
  }

  if (!units.length) {
    return (
      <section className="card-next rounded-3xl p-6">
        <h2 className="text-2xl font-semibold">Captura tipo Excel</h2>
        <p className="mt-2 text-sm text-amber-300">
          El organizador aún no configuró unidades académicas para esta edición.
        </p>
      </section>
    );
  }

  if (remainingSlots <= 0) {
    return (
      <section className="card-next rounded-3xl p-6">
        <h2 className="text-2xl font-semibold">Captura tipo Excel</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Este equipo ya completo sus {maxTeamMembers} participantes incluyendo al encargado.
        </p>
      </section>
    );
  }

  return (
    <section className="card-next rounded-3xl p-6">
      <h2 className="text-2xl font-semibold">Captura tipo Excel</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Puedes pegar filas desde Excel o Google Sheets con 6 columnas: nombre, matricula, correo,
        grado/grupo, unidad y carrera (el texto de unidad/carrera debe coincidir con el catálogo de
        esta edición).
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Espacios disponibles: <span className="font-semibold text-foreground">{remainingSlots}</span>
      </p>

      <div className="mt-5 grid gap-3">
        <label className="text-sm text-muted-foreground">Pegar tabla (tabuladores y saltos de linea)</label>
        <textarea
          value={pasteText}
          onChange={(event) => setPasteText(event.target.value)}
          className="min-h-28 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
          placeholder={"Nombre\tMatricula\tcorreo@uan.edu.mx\tGrado\tUnidad\tCarrera"}
        />
        <button
          type="button"
          onClick={() => applyPastedGrid(pasteText)}
          className="w-fit rounded-full border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:bg-white/10 hover:text-foreground"
        >
          Aplicar pegado a la tabla
        </button>
      </div>

      <form action={submitAction} onSubmit={handleSubmit} className="mt-6">
        <input ref={hiddenPayloadRef} type="hidden" name="membersJson" defaultValue="[]" />

        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[980px] text-left">
            <thead className="bg-white/5 text-sm text-muted-foreground">
              <tr>
                <th className="px-3 py-3">Nombre completo</th>
                <th className="px-3 py-3">Matricula</th>
                <th className="px-3 py-3">Correo institucional</th>
                <th className="px-3 py-3">Grado y grupo</th>
                <th className="px-3 py-3">Unidad academica</th>
                <th className="px-3 py-3">Carrera</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const programsForUnit = getProgramsForUnit(row.academicUnitCode);
                return (
                  <tr key={`member-row-${index + 1}`} className="border-t border-white/10">
                    <td className="px-3 py-2">
                      <input
                        value={row.fullName}
                        onChange={(event) => updateRow(index, { fullName: event.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
                        placeholder={`Integrante ${index + 1}`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={row.matricula}
                        onChange={(event) => updateRow(index, { matricula: event.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
                        placeholder="22123456"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={row.institutionalEmail}
                        onChange={(event) =>
                          updateRow(index, { institutionalEmail: event.target.value.toLowerCase() })
                        }
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
                        placeholder="alumno@uan.edu.mx"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={row.gradoGrupo}
                        onChange={(event) => updateRow(index, { gradoGrupo: event.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
                        placeholder="4A"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={row.academicUnitCode}
                        onChange={(event) => updateRow(index, { academicUnitCode: event.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
                      >
                        {units.map((unit) => (
                          <option key={unit.code} value={unit.code}>
                            {unit.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={row.academicProgramCode}
                        onChange={(event) => updateRow(index, { academicProgramCode: event.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
                      >
                        {programsForUnit.map((program) => (
                          <option key={program.code} value={program.code}>
                            {program.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {warningMessage ? <p className="mt-4 text-sm text-amber-300">{warningMessage}</p> : null}
        {errorMessage ? <p className="mt-2 text-sm text-rose-300">{errorMessage}</p> : null}
        {!errorMessage && submitState.status === "error" ? (
          <p className="mt-2 text-sm text-rose-300">{submitState.message}</p>
        ) : null}
        {!errorMessage && submitState.status === "success" ? (
          <p className="mt-2 text-sm text-emerald-300">{submitState.message}</p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-sheen mt-5 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm hover:bg-white/10"
        >
          {isSubmitting ? "Guardando..." : "Guardar captura masiva"}
        </button>
      </form>
    </section>
  );
}
