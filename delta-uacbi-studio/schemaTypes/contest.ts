import { defineField, defineType } from "sanity";

export const contest = defineType({
  name: "contest",
  title: "Concurso / Convocatoria",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Título", type: "string", validation: (r) => r.required() }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "title", maxLength: 96 }, validation: (r) => r.required() }),
    defineField({ name: "status", title: "Estatus", type: "string", options: { list: ["Abierto", "Cerrado", "Próximo"] }, initialValue: "Abierto" }),
    defineField({ name: "deadline", title: "Fecha límite", type: "datetime" }),
    defineField({ name: "excerpt", title: "Resumen", type: "text", rows: 3 }),
    defineField({ name: "coverImage", title: "Imagen", type: "image", options: { hotspot: true } }),
    defineField({ name: "body", title: "Detalles", type: "array", of: [{ type: "block" }] }),
    defineField({ name: "attachments", title: "Archivos", type: "array", of: [{ type: "file" }] }),
  ],
});
