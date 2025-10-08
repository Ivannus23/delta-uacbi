"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const f = e.currentTarget as any;

    const data = {
      slug: f.slug.value.trim(),
      titleES: f.titleES.value.trim(),
      titleEN: f.titleEN.value.trim(),
      summaryES: f.summaryES.value.trim(),
      summaryEN: f.summaryEN.value.trim(),
      descriptionES: f.descriptionES.value.trim(),
      descriptionEN: f.descriptionEN.value.trim(),
    };

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setLoading(false);

    if (res.ok) router.push("/projects");
    else {
      const j = await res.json().catch(() => ({}));
      setErr(j?.error || "No se pudo enviar");
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Enviar proyecto</h1>
      {err && <p className="text-red-600 text-sm">{err}</p>}

      <form onSubmit={onSubmit} className="space-y-3">
        <input name="slug" placeholder="slug-ejemplo" className="border rounded p-2 w-full" required />
        <input name="titleES" placeholder="Título (ES)" className="border rounded p-2 w-full" required />
        <input name="titleEN" placeholder="Title (EN)" className="border rounded p-2 w-full" />
        <textarea name="summaryES" placeholder="Resumen (ES)" className="border rounded p-2 w-full" required />
        <textarea name="summaryEN" placeholder="Summary (EN)" className="border rounded p-2 w-full" />
        <textarea name="descriptionES" placeholder="Descripción (ES)" className="border rounded p-2 w-full" required />
        <textarea name="descriptionEN" placeholder="Description (EN)" className="border rounded p-2 w-full" />
        <button disabled={loading} className="px-4 py-2 rounded border">
          {loading ? "Enviando..." : "Enviar"}
        </button>
      </form>
    </div>
  );
}
