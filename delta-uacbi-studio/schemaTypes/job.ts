import { defineField, defineType } from "sanity";

export const job = defineType({
  name: "job",
  title: "Vacante",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Puesto", type: "string", validation: (r) => r.required() }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "title", maxLength: 96 }, validation: (r) => r.required() }),
    defineField({ name: "company", title: "Empresa", type: "string", validation: (r) => r.required() }),
    defineField({ name: "location", title: "Ubicación", type: "string" }),
    defineField({ name: "type", title: "Tipo", type: "string", options: { list: ["Prácticas", "Medio tiempo", "Tiempo completo", "Proyecto", "Beca"] } }),
    defineField({ name: "applyUrl", title: "Link de postulación", type: "url" }),
    defineField({ name: "publishedAt", title: "Fecha", type: "datetime", initialValue: () => new Date().toISOString() }),
    defineField({ name: "body", title: "Descripción", type: "array", of: [{ type: "block" }] }),
  ],
});
