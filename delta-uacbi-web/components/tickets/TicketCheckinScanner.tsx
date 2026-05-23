"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type CheckinStatus = "VALID" | "USED" | "CANCELLED" | "NOT_FOUND" | "INVALID";

type CheckinTicket = {
  id: string;
  qrToken: string;
  folio: string;
  eventTitle: string;
  ticketTypeName: string;
  buyerName: string;
  usedAt: string | null;
};

type CheckinApiResponse = {
  ok: boolean;
  message?: string;
  status?: CheckinStatus;
  ticket?: CheckinTicket | null;
};

type BarcodeDetectorLike = {
  detect(source: ImageBitmapSource): Promise<Array<{ rawValue?: string }>>;
};

type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => BarcodeDetectorLike;

function getBarcodeDetectorConstructor() {
  return (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
}

function extractQrToken(rawValue: string) {
  const raw = rawValue.trim();
  if (!raw) {
    return "";
  }

  const parsePathToken = (value: string) => {
    const segments = value.split("/").filter(Boolean);
    const boletoIndex = segments.findIndex((segment) => segment === "boleto");
    if (boletoIndex >= 0 && segments[boletoIndex + 1]) {
      return decodeURIComponent(segments[boletoIndex + 1]);
    }
    const validarIndex = segments.findIndex((segment) => segment === "validar");
    if (validarIndex >= 0 && segments[validarIndex + 1]) {
      return decodeURIComponent(segments[validarIndex + 1]);
    }
    return "";
  };

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      const url = new URL(raw);
      const token = parsePathToken(url.pathname);
      if (token) {
        return token;
      }
    } catch {
      // no-op
    }
  }

  const embeddedPathToken = parsePathToken(raw);
  if (embeddedPathToken) {
    return embeddedPathToken;
  }

  return raw;
}

function getResultStyles(status: CheckinStatus | null) {
  if (status === "VALID") {
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
  }
  if (status === "USED") {
    return "border-amber-500/40 bg-amber-500/10 text-amber-200";
  }
  return "border-rose-500/40 bg-rose-500/10 text-rose-200";
}

export function TicketCheckinScanner() {
  const [inputValue, setInputValue] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [result, setResult] = useState<CheckinApiResponse | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);

  const barcodeSupported = useMemo(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return Boolean(getBarcodeDetectorConstructor());
  }, []);

  const stopCamera = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const submitCheckin = useCallback(async (rawValue: string) => {
    const qrToken = extractQrToken(rawValue);
    if (!qrToken) {
      setResult({
        ok: false,
        message: "Token de boleto invalido.",
      });
      return;
    }

    setIsBusy(true);
    try {
      const response = await fetch("/api/tickets/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ qrToken }),
      });

      const payload = (await response.json().catch(() => null)) as CheckinApiResponse | null;
      if (!payload) {
        throw new Error("No se pudo procesar la respuesta.");
      }

      setResult(payload);
      setInputValue(qrToken);
    } catch (error) {
      setResult({
        ok: false,
        message: error instanceof Error ? error.message : "No se pudo validar el boleto.",
      });
    } finally {
      setIsBusy(false);
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);

    if (!barcodeSupported) {
      setCameraError("Tu navegador no soporta escaneo QR por camara. Usa captura manual.");
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      if (!videoRef.current) {
        mediaStream.getTracks().forEach((track) => track.stop());
        throw new Error("No se pudo inicializar la camara.");
      }

      videoRef.current.srcObject = mediaStream;
      await videoRef.current.play();
      streamRef.current = mediaStream;
      setCameraActive(true);

      const BarcodeDetectorCtor = getBarcodeDetectorConstructor();
      if (!BarcodeDetectorCtor) {
        throw new Error("BarcodeDetector no disponible.");
      }
      const detector = new BarcodeDetectorCtor({ formats: ["qr_code"] });

      intervalRef.current = window.setInterval(async () => {
        if (!videoRef.current || isBusy) {
          return;
        }

        try {
          const detections = await detector.detect(videoRef.current);
          const value = detections.find((item) => typeof item.rawValue === "string" && item.rawValue.trim())?.rawValue;

          if (value) {
            stopCamera();
            await submitCheckin(value);
          }
        } catch {
          // ignore frame errors while scanning
        }
      }, 700);
    } catch (error) {
      stopCamera();
      setCameraError(error instanceof Error ? error.message : "No se pudo iniciar la camara.");
    }
  }, [barcodeSupported, isBusy, stopCamera, submitCheckin]);

  return (
    <section className="card-next rounded-3xl p-6">
      <h2 className="text-2xl font-semibold">Check-in de boletos</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Escanea el QR o captura el token manualmente para validar acceso.
      </p>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto]">
        <input
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          placeholder="Pega token o URL del QR"
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
        />
        <button
          type="button"
          onClick={() => void submitCheckin(inputValue)}
          disabled={isBusy}
          className="btn-sheen rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm hover:bg-white/10 disabled:opacity-50"
        >
          {isBusy ? "Validando..." : "Validar token"}
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void startCamera()}
          disabled={cameraActive}
          className="rounded-full border border-white/10 px-4 py-2 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          Iniciar camara
        </button>
        <button
          type="button"
          onClick={stopCamera}
          disabled={!cameraActive}
          className="rounded-full border border-white/10 px-4 py-2 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          Detener camara
        </button>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
        <video ref={videoRef} className="h-[280px] w-full object-cover" playsInline muted />
      </div>
      {cameraError ? <p className="mt-2 text-sm text-amber-300">{cameraError}</p> : null}
      {!barcodeSupported ? (
        <p className="mt-2 text-xs text-muted-foreground">El escaneo por camara depende del navegador (BarcodeDetector).</p>
      ) : null}

      {result?.message ? (
        <div className={`mt-6 rounded-2xl border px-4 py-4 ${getResultStyles(result.status || null)}`}>
          <p className="text-sm font-medium">{result.message}</p>
          {result.ticket ? (
            <div className="mt-3 grid gap-2 text-xs">
              <p>Folio: {result.ticket.folio}</p>
              <p>Evento: {result.ticket.eventTitle}</p>
              <p>Tipo de boleto: {result.ticket.ticketTypeName}</p>
              <p>Comprador: {result.ticket.buyerName}</p>
              <p>
                Hora de uso:{" "}
                {result.ticket.usedAt
                  ? new Date(result.ticket.usedAt).toLocaleString("es-MX")
                  : result.status === "VALID"
                    ? "Marcado en este momento"
                    : "Sin registro"}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
