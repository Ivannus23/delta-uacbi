import { defineField, defineType } from "sanity";

export const notice = defineType({
  name: "notice",
  title: "Aviso",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Título", type: "string", validation: (r) => r.required() }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "title", maxLength: 96 }, validation: (r) => r.required() }),
    defineField({ name: "publishedAt", title: "Fecha", type: "datetime", initialValue: () => new Date().toISOString(), validation: (r) => r.required() }),
    defineField({ name: "excerpt", title: "Resumen", type: "text", rows: 3 }),
    defineField({ name: "category", title: "Categoría", type: "string", options: { list: ["General", "Académico", "Evento", "Convocatoria", "Urgente"] } }),
    defineField({ name: "coverImage", title: "Imagen", type: "image", options: { hotspot: true } }),

    defineField({
      name: "body",
      title: "Contenido",
      type: "array",
      of: [
        { type: "block" },
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({
              name: "alt",
              title: "Texto alternativo",
              type: "string",
              description: "Descripción corta para accesibilidad/SEO.",
            }),
          ],
        },
      ],
    }),

    defineField({ name: "pinned", title: "Fijar (pin)", type: "boolean", initialValue: false }),
  ],
});
