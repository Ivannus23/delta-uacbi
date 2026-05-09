"use client";

import { FormEvent, useActionState, useMemo, useRef, useState } from "react";

type MemberDraft = {
  fullName: string;
  matricula: string;
  institutionalEmail: string;
  gradoGrupo: string;
  academicUnit: "UAE" | "UACBI";
  academicProgram: string;
};

type MembersSpreadsheetProps = {
  remainingSlots: number;
  maxTeamMembers: number;
  action: (
    prevState: { status: "idle" | "success" | "error"; message: string },
    formData: FormData
  ) => Promise<{ status: "idle" | "success" | "error"; message: string }>;
};

const EMAIL_REGEX = /^[a-z0-9._%+-]+@uan\.edu\.mx$/i;

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

const UAE_PROGRAM = {
  value: "LICENCIATURA_ENFERMERIA",
  label: "Licenciatura en Enfermeria",
} as const;

const INITIAL_SUBMIT_STATE = {
  status: "idle" as const,
  message: "",
};

function createEmptyRows(count: number): MemberDraft[] {
  return Array.from({ length: count }, () => ({
    fullName: "",
    matricula: "",
    institutionalEmail: "",
    gradoGrupo: "",
    academicUnit: "UACBI",
    academicProgram: UACBI_PROGRAM_OPTIONS[0].value,
  }));
}

function getAllowedProgramsForUnit(unit: "UAE" | "UACBI") {
  if (unit === "UAE") {
    return [UAE_PROGRAM];
  }
  return [...UACBI_PROGRAM_OPTIONS];
}

function resolveProgramForUnit(unit: "UAE" | "UACBI", rawProgram: string) {
  if (unit === "UAE") {
    return UAE_PROGRAM.value;
  }
  const normalized = rawProgram.trim();
  const matched = UACBI_PROGRAM_OPTIONS.find(
    (option) => option.value === normalized || option.label.toLowerCase() === normalized.toLowerCase()
  );
  return matched?.value ?? UACBI_PROGRAM_OPTIONS[0].value;
}

function resolveUnitFromRaw(rawUnit: string): "UAE" | "UACBI" {
  return rawUnit.trim().toUpperCase() === "UAE" ? "UAE" : "UACBI";
}

export function MembersSpreadsheet({ remainingSlots, maxTeamMembers, action }: MembersSpreadsheetProps) {
  const [rows, setRows] = useState<MemberDraft[]>(() => createEmptyRows(remainingSlots));
  const hiddenPayloadRef = useRef<HTMLInputElement>(null);
  const [pasteText, setPasteText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [submitState, submitAction, isSubmitting] = useActionState(action, INITIAL_SUBMIT_STATE);

  const programAliasToValue = useMemo(() => {
    const pairs: Array<[string, string]> = UACBI_PROGRAM_OPTIONS.flatMap((option) => [
      [option.label.toLowerCase(), option.value] as const,
      [option.value.toLowerCase(), option.value] as const,
    ]);
    pairs.push([UAE_PROGRAM.label.toLowerCase(), UAE_PROGRAM.value]);
    pairs.push([UAE_PROGRAM.value.toLowerCase(), UAE_PROGRAM.value]);
    return new Map<string, string>(pairs);
  }, []);

  function updateRow(index: number, patch: Partial<MemberDraft>) {
    setRows((currentRows) =>
      currentRows.map((row, rowIndex) => {
        if (rowIndex !== index) {
          return row;
        }

        const nextUnit = (patch.academicUnit ?? row.academicUnit) as "UAE" | "UACBI";
        const nextProgram = patch.academicProgram ?? row.academicProgram;

        return {
          ...row,
          ...patch,
          academicUnit: nextUnit,
          academicProgram:
            nextUnit === "UAE"
              ? UAE_PROGRAM.value
              : resolveProgramForUnit(nextUnit, nextProgram),
        };
      })
    );
  }

  function applyPastedGrid(rawText: string) {
    const lines = rawText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (!lines.length) {
      return;
    }

    let detectedLegacyFiveColumns = false;

    setRows((currentRows) => {
      const nextRows = [...currentRows];

      for (let index = 0; index < Math.min(lines.length, nextRows.length); index += 1) {
        const columns = lines[index].split("\t");
        const hasSixColumns = columns.length >= 6;
        if (!hasSixColumns) {
          detectedLegacyFiveColumns = true;
        }

        const unitRaw = hasSixColumns ? String(columns[4] ?? "").trim() : "";
        const programRaw = String(columns[hasSixColumns ? 5 : 4] ?? "").trim();
        const inferredProgram = programAliasToValue.get(programRaw.toLowerCase()) ?? programRaw;
        const inferredUnit =
          hasSixColumns && unitRaw
            ? resolveUnitFromRaw(unitRaw)
            : inferredProgram === UAE_PROGRAM.value
              ? "UAE"
              : "UACBI";

        nextRows[index] = {
          fullName: String(columns[0] ?? "").trim(),
          matricula: String(columns[1] ?? "").trim(),
          institutionalEmail: String(columns[2] ?? "").trim().toLowerCase(),
          gradoGrupo: String(columns[3] ?? "").trim(),
          academicUnit: inferredUnit,
          academicProgram: resolveProgramForUnit(inferredUnit, inferredProgram),
        };
      }

      return nextRows;
    });

    if (detectedLegacyFiveColumns) {
      setWarningMessage(
        "Se detecto formato de 5 columnas. Se infirio la unidad academica por la carrera pegada."
      );
    } else {
      setWarningMessage(null);
    }

    setErrorMessage(null);
  }

  function normalizeForSubmit() {
    const payload = rows
      .map((row) => ({
        fullName: row.fullName.trim(),
        matricula: row.matricula.trim(),
        institutionalEmail: row.institutionalEmail.trim().toLowerCase(),
        gradoGrupo: row.gradoGrupo.trim(),
        academicUnit: row.academicUnit,
        academicProgram:
          row.academicUnit === "UAE"
            ? UAE_PROGRAM.value
            : resolveProgramForUnit("UACBI", row.academicProgram),
      }))
      .filter((row) =>
        Boolean(
          row.fullName || row.matricula || row.institutionalEmail || row.gradoGrupo
        )
      );

    if (!payload.length) {
      throw new Error("No hay integrantes para guardar.");
    }

    const matriculas = new Set<string>();
    const emails = new Set<string>();

    for (const row of payload) {
      if (
        !row.fullName ||
        !row.matricula ||
        !row.institutionalEmail ||
        !row.gradoGrupo ||
        !row.academicUnit ||
        !row.academicProgram
      ) {
        throw new Error("Completa todos los campos de las filas capturadas o borra la fila.");
      }

      if (!EMAIL_REGEX.test(row.institutionalEmail)) {
        throw new Error("Todos los correos deben terminar en @uan.edu.mx.");
      }

      if (row.academicUnit === "UAE" && row.academicProgram !== UAE_PROGRAM.value) {
        throw new Error("Para UAE la carrera valida es solo Licenciatura en Enfermeria.");
      }

      if (
        row.academicUnit === "UACBI" &&
        !UACBI_PROGRAM_OPTIONS.some((program) => program.value === row.academicProgram)
      ) {
        throw new Error("Para UACBI selecciona una carrera valida.");
      }

      const matriculaKey = row.matricula.toUpperCase();
      const emailKey = row.institutionalEmail.toLowerCase();

      if (matriculas.has(matriculaKey)) {
        throw new Error("Matricula duplicada en el archivo.");
      }
      if (emails.has(emailKey)) {
        throw new Error("Correo duplicado en el archivo.");
      }

      matriculas.add(matriculaKey);
      emails.add(emailKey);
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
        grado/grupo, unidad y carrera.
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
                const allowedPrograms = getAllowedProgramsForUnit(row.academicUnit);
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
                        value={row.academicUnit}
                        onChange={(event) =>
                          updateRow(index, {
                            academicUnit: event.target.value as "UAE" | "UACBI",
                          })
                        }
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
                      >
                        <option value="UACBI">UACBI</option>
                        <option value="UAE">UAE</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={row.academicUnit === "UAE" ? UAE_PROGRAM.value : row.academicProgram}
                        onChange={(event) =>
                          updateRow(index, {
                            academicProgram: event.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
                      >
                        {allowedPrograms.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
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
