"use client";

import { useActionState } from "react";
import { TicketEventStatus } from "@prisma/client";
import { createTicketEventWithState, type TicketAdminActionState } from "@/app/tickets/admin/actions";

const INITIAL_STATE: TicketAdminActionState = {
  status: "idle",
  message: "",
};

export function AdminTicketEventForm() {
  const [state, formAction, isPending] = useActionState(createTicketEventWithState, INITIAL_STATE);

  return (
    <section className="card-next rounded-3xl p-6">
      <h2 className="text-2xl font-semibold">Crear evento</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Solo administradores pueden crear o actualizar eventos de Delta Tickets.
      </p>

      <form action={formAction} className="mt-5 grid gap-4">
        <div>
          <label className="mb-2 block text-sm text-muted-foreground">Titulo</label>
          <input
            name="title"
            required
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
            placeholder="Fiesta Delta Neon Night"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-muted-foreground">Slug (opcional)</label>
          <input
            name="slug"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
            placeholder="fiesta-delta-neon-night"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-muted-foreground">Descripcion</label>
          <textarea
            name="description"
            rows={3}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
            placeholder="Evento interno con cupo limitado."
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">Fecha y hora</label>
            <input
              type="datetime-local"
              name="eventDate"
              required
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">Estado inicial</label>
            <select
              name="status"
              defaultValue={TicketEventStatus.DRAFT}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
            >
              <option value={TicketEventStatus.DRAFT}>DRAFT</option>
              <option value={TicketEventStatus.PUBLISHED}>PUBLISHED</option>
              <option value={TicketEventStatus.CLOSED}>CLOSED</option>
              <option value={TicketEventStatus.CANCELLED}>CANCELLED</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">Lugar</label>
            <input
              name="location"
              required
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
              placeholder="Centro de Convenciones UACBI"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">Imagen (URL, opcional)</label>
            <input
              type="url"
              name="imageUrl"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
              placeholder="https://..."
            />
          </div>
        </div>

        {state.status === "error" ? <p className="text-sm text-rose-300">{state.message}</p> : null}
        {state.status === "success" ? <p className="text-sm text-emerald-300">{state.message}</p> : null}

        <button
          type="submit"
          disabled={isPending}
          className="btn-sheen w-fit rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm hover:bg-white/10"
        >
          {isPending ? "Guardando..." : "Crear evento"}
        </button>
      </form>
    </section>
  );
}
