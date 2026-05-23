type TicketMercadoPagoButtonProps = {
  publicToken: string;
  disabled: boolean;
  disabledMessage: string | null;
};

export function TicketMercadoPagoButton({
  publicToken,
  disabled,
  disabledMessage,
}: TicketMercadoPagoButtonProps) {
  return (
    <section className="card-next rounded-3xl p-6">
      <h2 className="text-2xl font-semibold">Pago con Mercado Pago</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Seras redirigido al checkout seguro de Mercado Pago para completar tu compra.
      </p>

      {disabled && disabledMessage ? <p className="mt-4 text-sm text-amber-300">{disabledMessage}</p> : null}

      <form action="/api/tickets/payments/mercadopago" method="post" className="mt-5">
        <input type="hidden" name="publicToken" value={publicToken} />
        <button
          type="submit"
          disabled={disabled}
          className="btn-sheen rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm hover:bg-white/10 disabled:opacity-50"
        >
          Pagar con Mercado Pago
        </button>
      </form>
    </section>
  );
}
