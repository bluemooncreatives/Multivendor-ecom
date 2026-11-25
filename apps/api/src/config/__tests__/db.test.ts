import { beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ connect: vi.fn(), disconnect: vi.fn(), init: vi.fn() }));
vi.mock("mongoose", () => ({ default: { set: vi.fn(), connect: mock.connect, disconnect: mock.disconnect,
  models: { User: { init: mock.init } }, connection: { on: vi.fn() } } }));
vi.mock("../env.js", () => ({ env: { MONGODB_URI: "mongodb://disposable.test", MONGODB_DB: "index_contract_test" } }));
vi.mock("../logger.js", () => ({ logger: { info: vi.fn(), error: vi.fn() } }));
beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); mock.connect.mockResolvedValue(undefined); mock.disconnect.mockResolvedValue(undefined); });

describe("database startup acceptance", () => {
  it("waits for required indexes before reporting a successful connection", async () => {
    let ready!: () => void;
    let start!: () => void;
    const started = new Promise<void>((resolve) => { start = resolve; });
    mock.init.mockImplementation(() => { start(); return new Promise<void>((resolve) => { ready = resolve; }); });
    const { connectDb, disconnectDb } = await import("../db.js");
    let settled = false;
    const connection = connectDb().then(() => { settled = true; });
    await started;
    expect(settled).toBe(false);
    ready();
    await connection;
    await connectDb();
    expect(mock.init).toHaveBeenCalledTimes(1);
    await disconnectDb();
    expect(mock.disconnect).toHaveBeenCalledTimes(1);
  });

  it("fails startup and closes the connection when a historical duplicate prevents an index", async () => {
    const failure = Object.assign(new Error("duplicate phone index"), { code: 11000 });
    mock.init.mockRejectedValue(failure);
    const { connectDb } = await import("../db.js");
    await expect(connectDb()).rejects.toBe(failure);
    expect(mock.disconnect).toHaveBeenCalledTimes(1);
    mock.init.mockResolvedValue(undefined);
    await expect(connectDb()).resolves.toBeDefined();
    expect(mock.connect).toHaveBeenCalledTimes(2);
  });
});
