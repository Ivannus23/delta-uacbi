"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type TeamMemberSearchItem = {
  id: string;
  fullName: string;
  matricula: string;
  institutionalEmail: string;
  isLeader: boolean;
};

type TeamSearchItem = {
  id: string;
  animal: string;
  status: string;
  responsableNombre: string;
  responsableMatricula: string | null;
  responsableCorreo: string;
  members: TeamMemberSearchItem[];
};

type SearchComponentProps = {
  teams: TeamSearchItem[];
};

type MemberSearchResult = TeamMemberSearchItem & {
  teamId: string;
  teamAnimal: string;
  teamStatus: string;
};

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function matchesAllTerms(terms: string[], values: Array<string | null | undefined>) {
  const normalizedValues = values.map((value) => normalizeSearchText(String(value || "")));
  return terms.every((term) => normalizedValues.some((value) => value.includes(term)));
}

export function AdminTeamsMemberSearch({ teams }: SearchComponentProps) {
  const [query, setQuery] = useState("");
  const queryTerms = useMemo(
    () => normalizeSearchText(query).split(/\s+/).filter(Boolean),
    [query]
  );

  const memberEntries = useMemo(() => {
    return teams.flatMap((team) =>
      team.members.map((member) => ({
        ...member,
        teamId: team.id,
        teamAnimal: team.animal,
        teamStatus: team.status,
      }))
    );
  }, [teams]);

  const filteredMembers = useMemo<MemberSearchResult[]>(() => {
    if (!queryTerms.length) {
      return [];
    }

    return memberEntries.filter((member) =>
      matchesAllTerms(queryTerms, [member.fullName, member.matricula, member.institutionalEmail])
    );
  }, [memberEntries, queryTerms]);

  const filteredTeams = useMemo(() => {
    if (!queryTerms.length) {
      return [];
    }

    return teams.filter((team) => {
      if (
        matchesAllTerms(queryTerms, [
          team.animal,
          team.responsableNombre,
          team.responsableMatricula,
          team.responsableCorreo,
        ])
      ) {
        return true;
      }

      return team.members.some((member) =>
        matchesAllTerms(queryTerms, [member.fullName, member.matricula, member.institutionalEmail])
      );
    });
  }, [queryTerms, teams]);

  const hasResults = filteredTeams.length > 0 || filteredMembers.length > 0;

  return (
    <section className="card-next rounded-3xl p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="text-2xl font-semibold">Busqueda rapida de participantes</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Busca por nombre, matricula o correo institucional en equipos e integrantes.
          </p>
        </div>
        <p className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground">
          {teams.length} equipos cargados
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
          placeholder="Ejemplo: 24210681 o alumno@uan.edu.mx"
        />
        <button
          type="button"
          onClick={() => setQuery("")}
          className="rounded-full border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:bg-white/10 hover:text-foreground"
        >
          Limpiar
        </button>
      </div>

      {queryTerms.length ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Equipos encontrados: {filteredTeams.length} - Integrantes encontrados: {filteredMembers.length}
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          Escribe un termino para ver coincidencias y detectar posibles duplicados mas rapido.
        </p>
      )}

      {queryTerms.length ? (
        <div className="mt-6 grid gap-6">
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Equipos</h4>
            <div className="mt-3 overflow-hidden rounded-2xl border border-white/10">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-sm text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Equipo</th>
                    <th className="px-4 py-3">Responsable</th>
                    <th className="px-4 py-3">Matricula responsable</th>
                    <th className="px-4 py-3">Correo responsable</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Accion</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeams.length ? (
                    filteredTeams.map((team) => (
                      <tr key={`team-search-${team.id}`} className="border-t border-white/10">
                        <td className="px-4 py-3 font-medium">{team.animal}</td>
                        <td className="px-4 py-3 text-muted-foreground">{team.responsableNombre}</td>
                        <td className="px-4 py-3 text-muted-foreground">{team.responsableMatricula || "-"}</td>
                        <td className="px-4 py-3 break-all text-muted-foreground">{team.responsableCorreo}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground">
                            {team.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/semana-cultural/equipos/${team.id}`}
                            className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                          >
                            Ver equipo
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-5 text-sm text-muted-foreground">
                        No hay equipos que coincidan con la busqueda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Integrantes</h4>
            <div className="mt-3 overflow-hidden rounded-2xl border border-white/10">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-sm text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Matricula</th>
                    <th className="px-4 py-3">Correo institucional</th>
                    <th className="px-4 py-3">Equipo</th>
                    <th className="px-4 py-3">Rol</th>
                    <th className="px-4 py-3">Accion</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.length ? (
                    filteredMembers.map((member) => (
                      <tr key={`member-search-${member.id}`} className="border-t border-white/10">
                        <td className="px-4 py-3 font-medium">{member.fullName}</td>
                        <td className="px-4 py-3 text-muted-foreground">{member.matricula}</td>
                        <td className="px-4 py-3 break-all text-muted-foreground">
                          {member.institutionalEmail}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{member.teamAnimal}</td>
                        <td className="px-4 py-3">
                          {member.isLeader ? (
                            <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-100">
                              Encargado
                            </span>
                          ) : (
                            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground">
                              Integrante
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/semana-cultural/equipos/${member.teamId}`}
                            className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                          >
                            Abrir equipo
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-5 text-sm text-muted-foreground">
                        No hay integrantes que coincidan con la busqueda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {queryTerms.length && !hasResults ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Ajusta los terminos para encontrar coincidencias por nombre, matricula o correo.
        </p>
      ) : null}
    </section>
  );
}
