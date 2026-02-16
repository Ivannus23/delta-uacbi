import { defineField, defineType } from "sanity";

export const project = defineType({
  name: "project",
  title: "Proyecto",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Título", type: "string", validation: (r) => r.required() }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "title", maxLength: 96 }, validation: (r) => r.required() }),
    defineField({ name: "publishedAt", title: "Fecha", type: "datetime", initialValue: () => new Date().toISOString() }),
    defineField({ name: "excerpt", title: "Resumen", type: "text", rows: 3 }),
    defineField({ name: "area", title: "Área", type: "string", options: { list: ["Mecánica", "Electrónica", "Software", "Energías", "Industrial", "Ciencias Básicas", "Otro"] } }),
    defineField({ name: "stack", title: "Tecnologías (stack)", type: "array", of: [{ type: "string" }] }),
    defineField({ name: "coverImage", title: "Imagen", type: "image", options: { hotspot: true } }),
    defineField({ name: "gallery", title: "Galería", type: "array", of: [{ type: "image", options: { hotspot: true } }] }),
    defineField({ name: "repoUrl", title: "Repo / Link", type: "url" }),
    defineField({ name: "body", title: "Descripción", type: "array", of: [{ type: "block" }] }),
  ],
});
