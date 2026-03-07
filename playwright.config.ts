import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: [["html"], ["list"]],
  timeout: 90_000,

  use: {
    baseURL: "http://localhost:3000/Js-CameraExperiment/",
    trace: "retain-on-failure",
    permissions: ["camera"],
    launchOptions: {
      args: [
        "--use-fake-device-for-media-stream",
        "--use-fake-ui-for-media-stream",
        "--use-gl=swiftshader",
        "--js-flags=--expose-gc",
      ],
    },
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "npm run dev",
    port: 3000,
    reuseExistingServer: true,
  },
});
