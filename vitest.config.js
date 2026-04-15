import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Simule un environnement navigateur (DOM disponible)
    environment: "jsdom",
    include: ["tests/js/**/*.test.js"],
    coverage: {
      provider: "v8",
      include: ["static/js/**/*.js"],
      exclude: ["static/js/main.js"], // Point d'entrée = inutile de tester étant donné que tout le reste l'est
      reporter: ["text", "text-summary"],
      all: true,
    },
  },
});
