import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"], maxWorkers: 1, minWorkers: 1,
    // Mark the process as a test run so per-IP auth throttling (shared across a
    // file's single app instance) does not accumulate and 429 later cases.
    env: { NODE_ENV: "test" },
    // Real replica-set transactions, bcrypt and process teardown need room on
    // slower Windows disks. Transaction hangs still fail within this bound.
    testTimeout: 30000, hookTimeout: 60000,
  },
});
