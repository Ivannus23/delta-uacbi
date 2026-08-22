"use client";

import { useState } from "react";

type ScoreCategoryOption = { id: string; label: string };

type EventScoringFieldsProps = {
  categories: ScoreCategoryOption[];
};

export function EventScoringFields({ categories }: EventScoringFieldsProps) {
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
        {categories.length ? (
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
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        ) : (
          <p className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
            No hay categorias de puntos configuradas para esta edición.
          </p>
        )}
      </div>
    </div>
  );
}
