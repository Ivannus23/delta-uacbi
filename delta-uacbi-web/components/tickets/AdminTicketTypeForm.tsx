"use client";

import { useActionState } from "react";
import { createTicketTypeWithState, type TicketAdminActionState } from "@/app/tickets/admin/actions";

type EventOption = {
  id: string;
  title: string;
  status: string;
};

type AdminTicketTypeFormProps = {
  events: EventOption[];
};

const INITIAL_STATE: TicketAdminActionState = {
  status: "idle",
  message: "",
};

export function AdminTicketTypeForm({ events }: AdminTicketTypeFormProps) {
  const [state, formAction, isPending] = useActionState(createTicketTypeWithState, INITIAL_STATE);

  return (
    <section className="card-next rounded-3xl p-6">
      <h2 className="text-2xl font-semibold">Crear tipo de boleto</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Crea categorias por evento: general, preventa, VIP o acceso especial.
      </p>

      <form action={formAction} className="mt-5 grid gap-4">
        <div>
          <label className="mb-2 block text-sm text-muted-foreground">Evento</label>
          <select
            name="eventId"
            required
            defaultValue=""
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
          >
            <option value="" disabled>
              Selecciona un evento
            </option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title} ({event.status})
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">Nombre</label>
            <input
              name="name"
              required
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
              placeholder="General"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">Precio (MXN)</label>
            <input
              name="price"
              type="number"
              min="1"
              step="0.01"
              required
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
              placeholder="250.00"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm text-muted-foreground">Descripcion (opcional)</label>
          <textarea
            name="description"
            rows={2}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
            placeholder="Incluye acceso general al evento."
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">Cantidad total</label>
            <input
              name="quantity"
              type="number"
              min="1"
              step="1"
              required
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
              placeholder="300"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">Maximo por orden</label>
            <input
              name="maxPerOrder"
              type="number"
              min="1"
              step="1"
              required
              defaultValue="10"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
            />
          </div>
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" name="isActive" defaultChecked className="h-4 w-4" />
          Tipo de boleto activo
        </label>

        {state.status === "error" ? <p className="text-sm text-rose-300">{state.message}</p> : null}
        {state.status === "success" ? <p className="text-sm text-emerald-300">{state.message}</p> : null}

        <button
          type="submit"
          disabled={isPending}
          className="btn-sheen w-fit rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm hover:bg-white/10"
        >
          {isPending ? "Guardando..." : "Crear tipo de boleto"}
        </button>
      </form>
    </section>
  );
}
