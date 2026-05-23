"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  confirmSimulatedPaymentWithState,
  INITIAL_TICKET_PAYMENT_STATE,
  type TicketPaymentActionState,
} from "@/app/tickets/actions";

type TicketSimulatedPaymentButtonProps = {
  publicToken: string;
  enabled: boolean;
  disabledMessage: string | null;
};

export function TicketSimulatedPaymentButton({
  publicToken,
  enabled,
  disabledMessage,
}: TicketSimulatedPaymentButtonProps) {
  const router = useRouter();
  const confirmAction = confirmSimulatedPaymentWithState.bind(null, publicToken);
  const [state, formAction, isPending] = useActionState<TicketPaymentActionState, FormData>(
    confirmAction,
    INITIAL_TICKET_PAYMENT_STATE
  );

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <section className="card-next rounded-3xl p-6">
      <h2 className="text-2xl font-semibold">Pago simulado</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Este flujo es para desarrollo y pruebas. No procesa pagos reales.
      </p>

      {state.status === "error" ? <p className="mt-4 text-sm text-rose-300">{state.message}</p> : null}
      {state.status === "success" ? <p className="mt-4 text-sm text-emerald-300">{state.message}</p> : null}
      {!enabled && disabledMessage ? <p className="mt-4 text-sm text-amber-300">{disabledMessage}</p> : null}

      <form action={formAction} className="mt-5">
        <button
          type="submit"
          disabled={!enabled || isPending}
          className="btn-sheen rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm hover:bg-white/10 disabled:opacity-50"
        >
          {isPending ? "Confirmando..." : "Confirmar pago simulado"}
        </button>
      </form>
    </section>
  );
}
