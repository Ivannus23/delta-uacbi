"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TicketType } from "@prisma/client";
import {
  createTicketOrderWithState,
  INITIAL_TICKET_PURCHASE_STATE,
} from "@/app/tickets/actions";
import { formatTicketMoney } from "@/lib/tickets/format";
import { TicketPaymentMode } from "@/lib/tickets/config";

type TicketPurchaseFormProps = {
  eventId: string;
  eventTitle: string;
  ticketTypes: TicketType[];
  paymentMode: TicketPaymentMode;
  paymentAvailable: boolean;
  paymentUnavailableMessage: string | null;
};

export function TicketPurchaseForm({
  eventId,
  eventTitle,
  ticketTypes,
  paymentMode,
  paymentAvailable,
  paymentUnavailableMessage,
}: TicketPurchaseFormProps) {
  const router = useRouter();
  const createOrderAction = createTicketOrderWithState.bind(null, eventId);
  const [state, formAction, isPending] = useActionState(createOrderAction, INITIAL_TICKET_PURCHASE_STATE);

  useEffect(() => {
    if (state.status === "success" && state.publicToken) {
      router.push(`/tickets/orden/${state.publicToken}`);
    }
  }, [router, state.publicToken, state.status]);

  return (
    <section className="card-next rounded-3xl p-6">
      <h2 className="text-2xl font-semibold">Comprar boletos</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Selecciona cantidades por tipo de boleto y completa los datos del comprador para generar una orden.
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Modo de pago activo: {paymentMode === "SIMULATED" ? "SIMULADO" : paymentMode === "MERCADOPAGO" ? "MERCADO PAGO" : "NO DISPONIBLE"}.
      </p>

      <form action={formAction} className="mt-6 grid gap-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">Nombre del comprador</label>
            <input
              name="buyerName"
              required
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
              placeholder="Nombre completo"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">Correo</label>
            <input
              type="email"
              name="buyerEmail"
              required
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
              placeholder="correo@uan.edu.mx"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">Telefono</label>
            <input
              name="buyerPhone"
              required
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
              placeholder="7711234567"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-sm text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Disponibles</th>
                <th className="px-4 py-3">Maximo por orden</th>
                <th className="px-4 py-3">Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {ticketTypes.length ? (
                ticketTypes.map((ticketType) => {
                  const available = Math.max(ticketType.quantity - ticketType.soldCount, 0);
                  return (
                    <tr key={ticketType.id} className="border-t border-white/10">
                      <td className="px-4 py-3">
                        <p className="font-medium">{ticketType.name}</p>
                        <p className="text-xs text-muted-foreground">{ticketType.description || "-"}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatTicketMoney(Number(ticketType.price))}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{available}</td>
                      <td className="px-4 py-3 text-muted-foreground">{ticketType.maxPerOrder}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={0}
                          step={1}
                          max={Math.min(available, ticketType.maxPerOrder)}
                          defaultValue={0}
                          name={`qty_${ticketType.id}`}
                          disabled={available <= 0}
                          className="w-24 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none disabled:opacity-50"
                        />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-5 text-sm text-muted-foreground">
                    Este evento no tiene tipos de boleto activos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {state.status === "error" ? <p className="text-sm text-rose-300">{state.message}</p> : null}
        {state.status === "success" && state.publicToken ? (
          <p className="text-sm text-emerald-300">
            Orden creada. Si no te redirige automaticamente, abre{" "}
            <Link className="underline" href={`/tickets/orden/${state.publicToken}`}>
              tu orden
            </Link>
            .
          </p>
        ) : null}

        {!paymentAvailable && paymentUnavailableMessage ? (
          <p className="text-sm text-amber-300">{paymentUnavailableMessage}</p>
        ) : null}

        <button
          type="submit"
          disabled={isPending || !ticketTypes.length || !paymentAvailable}
          className="btn-sheen w-fit rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm hover:bg-white/10 disabled:opacity-50"
        >
          {isPending ? "Creando orden..." : `Crear orden para ${eventTitle}`}
        </button>
      </form>
    </section>
  );
}
