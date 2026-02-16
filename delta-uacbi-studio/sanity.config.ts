import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./schemaTypes";

export default defineConfig({
  name: "default",
  title: "delta-uacbi-studio",

  projectId: "zke2w29g",
  dataset: "production",

  plugins: [structureTool(), visionTool()],
  schema: { types: schemaTypes },
});
