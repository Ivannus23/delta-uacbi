"use client";

import { MAX_TEAM_MEMBERS } from "@/lib/semana-cultural-config";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createTeamWithState, type CreateTeamState } from "@/app/semana-cultural/registro/actions";
import { RegistroUnidadProgramaField } from "./RegistroUnidadProgramaField";
import { SuggestionSelect } from "./SuggestionSelect";

type RegistroTeamFormProps = {
  userName: string;
  userEmail: string;
  availableAnimales: string[];
  noAnimalesAvailable: boolean;
  canRegisterTeam: boolean;
};

const INITIAL_CREATE_TEAM_STATE: CreateTeamState = {
  status: "idle",
  message: "",
  teamId: null,
};

export function RegistroTeamForm({
  userName,
  userEmail,
  availableAnimales,
  noAnimalesAvailable,
  canRegisterTeam,
}: RegistroTeamFormProps) {
  const router = useRouter();
  const [submitState, submitAction, isSubmitting] = useActionState(
    createTeamWithState,
    INITIAL_CREATE_TEAM_STATE
  );

  useEffect(() => {
    if (submitState.status === "success" && submitState.teamId) {
      router.push(`/semana-cultural/equipos/${submitState.teamId}`);
    }
  }, [router, submitState.status, submitState.teamId]);

  return (
    <form action={submitAction} className="mt-8 card-next rounded-3xl p-6">
      <div className="mb-6 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">
          Paso 2 de 2
        </p>
        <p className="mt-2 text-sm text-emerald-50">
          Vas a registrar como responsable a <strong>{userName}</strong> con el correo{" "}
          <strong>{userEmail}</strong>.
        </p>
        <p className="mt-2 text-sm text-emerald-100/90">
          El encargado tambien cuenta como participante inicial del equipo (1/{MAX_TEAM_MEMBERS}).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <RegistroUnidadProgramaField
          unidadName="responsableAcademicUnit"
          programName="responsableAcademicProgram"
          unidadLabel="Unidad academica del responsable"
          programLabel="Carrera del responsable"
        />

        <div>
          <label className="mb-2 block text-sm text-muted-foreground">Animal</label>
          <SuggestionSelect
            name="animal"
            options={availableAnimales.map((animal) => ({ value: animal, label: animal }))}
            placeholder={
              noAnimalesAvailable ? "Ya no hay animales disponibles" : "Escribe o selecciona un animal"
            }
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
            required
            disabled={noAnimalesAvailable}
          />
        </div>

        <div className="sm:col-span-2">
          <p className="text-sm text-muted-foreground">
            El equipo se identifica por el animal seleccionado.
          </p>
          {noAnimalesAvailable ? (
            <p className="mt-2 text-sm text-amber-300">
              Ya no hay animales disponibles para esta edicion activa.
            </p>
          ) : null}
        </div>

        <div>
          <label className="mb-2 block text-sm text-muted-foreground">Responsable</label>
          <input
            name="responsableNombre"
            defaultValue={userName}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
            placeholder="Nombre del jefe de grupo"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-muted-foreground">Telefono</label>
          <input
            name="responsableTelefono"
            required
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
            placeholder="Telefono del responsable"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-muted-foreground">Matricula del responsable</label>
          <input
            name="responsableMatricula"
            required
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
            placeholder="Ej. 22123456"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-muted-foreground">
            Grado y grupo del responsable
          </label>
          <input
            name="responsableGradoGrupo"
            required
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
            placeholder="Ej. 4A"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm text-muted-foreground">Correo del responsable</label>
          <input
            value={userEmail}
            readOnly
            disabled
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-muted-foreground outline-none"
          />
        </div>
      </div>

      {submitState.status === "error" ? (
        <p className="mt-4 text-sm text-rose-300">{submitState.message}</p>
      ) : null}

      <div className="mt-6">
        <button
          type="submit"
          disabled={!canRegisterTeam || isSubmitting}
          className="btn-sheen rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Registrando..." : "Registrar equipo"}
        </button>
      </div>
    </form>
  );
}
