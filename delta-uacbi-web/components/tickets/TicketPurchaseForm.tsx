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
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Input";

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
    <Card variant="surface">
      <h2 className="font-display text-2xl font-semibold">Comprar boletos</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Selecciona cantidades por tipo de boleto y completa los datos del comprador para generar una orden.
      </p>
      <div className="mt-3">
        <Badge variant="tickets" dot>
          Modo de pago: {paymentMode === "SIMULATED" ? "Simulado" : paymentMode === "MERCADOPAGO" ? "Mercado Pago" : "No disponible"}
        </Badge>
      </div>

      <form action={formAction} className="mt-6 grid gap-5">
        <div className="grid gap-4 md:grid-cols-3">
          <Input label="Nombre del comprador" name="buyerName" required placeholder="Nombre completo" />
          <Input label="Correo" type="email" name="buyerEmail" required placeholder="correo@uan.edu.mx" />
          <Input label="Telefono" name="buyerPhone" required placeholder="7711234567" />
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
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          max={Math.min(available, ticketType.maxPerOrder)}
                          defaultValue={0}
                          name={`qty_${ticketType.id}`}
                          disabled={available <= 0}
                          className="w-24"
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

        {state.status === "error" ? <Alert variant="error">{state.message}</Alert> : null}
        {state.status === "success" && state.publicToken ? (
          <Alert variant="success">
            Orden creada. Si no te redirige automaticamente, abre{" "}
            <Link className="underline" href={`/tickets/orden/${state.publicToken}`}>
              tu orden
            </Link>
            .
          </Alert>
        ) : null}

        {!paymentAvailable && paymentUnavailableMessage ? (
          <Alert variant="warning">{paymentUnavailableMessage}</Alert>
        ) : null}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isPending}
          disabled={!ticketTypes.length || !paymentAvailable}
          className="w-fit"
        >
          {isPending ? "Creando orden..." : `Crear orden para ${eventTitle}`}
        </Button>
      </form>
    </Card>
  );
}
