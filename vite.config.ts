import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    lib: {
      name: "endless-tower",
      entry: path.resolve(__dirname, "src/main.ts"),
      formats: ["es"],
      fileName: () => "endless-tower.js"
    },
    sourcemap: true,
    minify: false
  }
});
