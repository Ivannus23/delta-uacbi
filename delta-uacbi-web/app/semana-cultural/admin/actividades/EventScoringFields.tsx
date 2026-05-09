"use client";

import { useState } from "react";

const scoreCategories = [
  { value: "TOPACIO", label: "Topacio" },
  { value: "DIAMANTE", label: "Diamante" },
  { value: "ESMERALDA", label: "Esmeralda" },
];

export function EventScoringFields() {
  const [isScored, setIsScored] = useState(true);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="mb-2 block text-sm text-muted-foreground">Esta actividad suma puntos?</label>
        <select
          name="isScored"
          defaultValue="true"
          required
          onChange={(event) => setIsScored(event.target.value === "true")}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
        >
          <option value="true">Si, suma puntos</option>
          <option value="false">No, solo cronograma</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm text-muted-foreground">Categoria de puntos</label>
        <select
          name="scoreCategory"
          required={isScored}
          disabled={!isScored}
          defaultValue=""
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="" disabled>
            {isScored ? "Selecciona categoria" : "No aplica"}
          </option>
          {scoreCategories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
