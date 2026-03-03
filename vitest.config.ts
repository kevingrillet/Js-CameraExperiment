import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    globals: true,
    // Exclure les tests nécessitant un environnement navigateur réel
    // (ImageData, Canvas, performance.now() avec fake timers, etc.)
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.{idea,git,cache,output,temp}/**",
      // Tests nécessitant APIs navigateur non disponibles dans Happy-DOM
      "**/FPSCounter.test.ts", // Utilise performance.now() incompatible avec vi.useFakeTimers()
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json", "cobertura"],
      exclude: [
        // Dépendances et build
        "node_modules/",
        "dist/",

        // Tests
        "**/*.test.ts",
        "**/__tests__/",

        // Configuration
        "**/*.config.ts",
        "**/*.config.js",

        // Fichiers dépendants du navigateur (impossible à tester en Node.js)
        "src/main.ts", // Point d'entrée DOM
        "src/ui/SettingsOverlay.ts", // Interface utilisateur complexe (DOM intensif)
        "src/ui/AdvancedSettingsModal.ts", // Modal (DOM intensif)
        "src/filters/webgl/**", // WebGL API
        "src/utils/CanvasCapture.ts", // Canvas API
        "src/core/FPSCounter.ts", // performance.now() avec requestAnimationFrame
        "src/core/FilterTransitionManager.ts", // ImageData API

        // Fichiers de définitions/données
        "src/i18n/translations.ts", // Données statiques
        "src/types/**", // Définitions TypeScript uniquement

        // Dossiers spéciaux
        "_bmad/**",
        "_bmad-output/**",
      ],
    },
  },
});
