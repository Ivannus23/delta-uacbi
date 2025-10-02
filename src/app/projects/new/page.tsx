"use client";
import { useState } from "react";

export default function NewProjectPage() {
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const body = Object.fromEntries(new FormData(form).entries());
    const res = await fetch("/api/projects", { method: "POST", body: JSON.stringify(body) });
    if (res.ok) {
      window.location.href = "/projects";
    } else {
      alert("Error al enviar");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Enviar proyecto</h1>
      <form onSubmit={submit} className="space-y-3">
        <input name="titleES" placeholder="Título (ES)" className="border p-2 w-full rounded-lg" required />
        <input name="titleEN" placeholder="Title (EN)" className="border p-2 w-full rounded-lg" required />
        <textarea name="summaryES" placeholder="Resumen (ES)" className="border p-2 w-full rounded-lg" required />
        <textarea name="summaryEN" placeholder="Summary (EN)" className="border p-2 w-full rounded-lg" required />
        <textarea name="descriptionES" placeholder="Descripción (ES)" className="border p-2 w-full rounded-lg" required />
        <textarea name="descriptionEN" placeholder="Description (EN)" className="border p-2 w-full rounded-lg" required />
        <input name="slug" placeholder="slug-unico" className="border p-2 w-full rounded-lg" required />
        <button disabled={loading} className="px-4 py-2 rounded-xl border">{loading ? "Enviando..." : "Enviar"}</button>
      </form>
    </div>
  );
}
