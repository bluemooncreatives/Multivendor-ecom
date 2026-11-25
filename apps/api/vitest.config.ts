import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"], maxWorkers: 1, minWorkers: 1,
    // Real replica-set transactions, bcrypt and process teardown need room on
    // slower Windows disks. Transaction hangs still fail within this bound.
    testTimeout: 30000, hookTimeout: 60000,
  },
});
