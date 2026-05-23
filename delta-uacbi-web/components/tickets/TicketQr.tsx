import QRCode from "qrcode";

type TicketQrProps = {
  value: string;
  size?: number;
};

export async function TicketQr({ value, size = 240 }: TicketQrProps) {
  const dataUrl = await QRCode.toDataURL(value, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: size,
    color: {
      dark: "#ffffff",
      light: "#111111",
    },
  });

  return (
    <img
      src={dataUrl}
      alt="QR del boleto"
      width={size}
      height={size}
      className="rounded-2xl border border-white/10 bg-[#111111] p-2"
    />
  );
}
