import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { User } from "../../../models/User.js";
import { migrateAuthIndexes } from "../auth-indexes.js";
import { findPhoneIdentity } from "../../../services/phone-identity.service.js";

let repl: MongoMemoryReplSet;
beforeAll(async () => {
  repl = await MongoMemoryReplSet.create({ binary: { version: "8.0.17" }, replSet: { count: 1 }, instanceOpts: [{ args: ["--wiredTigerCacheSizeGB", "0.25"] }] });
  await mongoose.connect(repl.getUri(), { dbName: "auth_index_migration_only" });
  await User.init();
}, 240000);
afterAll(async () => { await mongoose.disconnect(); await repl?.stop(); });
beforeEach(async () => {
  // This database belongs only to the disposable replica set created above.
  await mongoose.connection.db!.dropDatabase();
  await User.createIndexes();
});

describe("auth index upgrade", () => {
  const users = () => mongoose.connection.db!.collection("users");
  async function oldEmailIndex() { await users().createIndex({ email: 1 }, { name: "email_1", unique: true }); }

  it("reports obsolete constraints without changing indexes or contacts by default", async () => {
    await oldEmailIndex();
    await users().createIndex({ phone: 1 }, { name: "phone_login_unique", unique: true, partialFilterExpression: { phone: { $type: "string", $gt: "" } } });
    await users().insertOne({ name: "Legacy", email: " Legacy@Example.Test ", phone: " +919300000001 ", phoneVerifiedAt: new Date() });
    const report = await migrateAuthIndexes(mongoose.connection.db!);
    expect(report.applied).toBe(false);
    expect(report.dropIndexes.sort()).toEqual(["email_1", "phone_login_unique"]);
    expect((await users().findOne({ name: "Legacy" }))!.email).toBe(" Legacy@Example.Test ");
    expect((await users().indexes()).some((index) => index.name === "email_1")).toBe(true);
  });

  it("upgrades before normalization, supports multiple phone-only accounts and can be replayed", async () => {
    await oldEmailIndex();
    await users().insertMany([{ name: "Legacy", email: " Legacy@Example.Test ", phone: " +919300000001 ", phoneVerifiedAt: new Date() },
      { name: "Old phone", email: null, phone: "+919300000002", phoneVerifiedAt: new Date() }]);
    const report = await migrateAuthIndexes(mongoose.connection.db!, true);
    expect(report.applied).toBe(true);
    expect((await users().findOne({ name: "Legacy" }))!).toMatchObject({ email: "legacy@example.test", phone: "+919300000001" });
    await User.create([{ name: "Phone A", phone: "+919300000003", phoneVerifiedAt: new Date(), passwordHash: "unused" },
      { name: "Phone B", phone: "+919300000004", phoneVerifiedAt: new Date(), passwordHash: "unused" }]);
    expect(await User.countDocuments({ email: { $exists: false } })).toBe(3);
    expect((await migrateAuthIndexes(mongoose.connection.db!, true)).applied).toBe(true);
    expect((await users().indexes()).some((index) => index.name === "email_1")).toBe(false);
  });

  it("refuses normalized email collisions before performing any writes", async () => {
    await oldEmailIndex();
    const inserted = await users().insertMany([{ email: "ALICE@example.test" }, { email: "alice@example.test" }]);
    const report = await migrateAuthIndexes(mongoose.connection.db!, true);
    expect(report.applied).toBe(false);
    expect(report.duplicateEmails).toMatchObject([{ count: 2 }]);
    expect((await users().findOne({ _id: inserted.insertedIds[0] }))!.email).toBe("ALICE@example.test");
    expect((await users().indexes()).some((index) => index.name === "email_1")).toBe(true);
  });

  it("refuses verified phone collisions but permits unverified duplicates without assigning an identity", async () => {
    await users().insertMany([{ phone: " +919300000005 ", phoneVerifiedAt: new Date() }, { phone: "+919300000005", phoneVerifiedAt: new Date() }]);
    const blocked = await migrateAuthIndexes(mongoose.connection.db!, true);
    expect(blocked.applied).toBe(false);
    expect(blocked.duplicateVerifiedPhones).toMatchObject([{ count: 2 }]);
    await users().deleteMany({});
    await users().insertMany([{ name: "Unverified A", phone: "+919300000006" }, { name: "Unverified B", phone: "+919300000006" }]);
    expect((await migrateAuthIndexes(mongoose.connection.db!, true)).applied).toBe(true);
    expect(await findPhoneIdentity("+919300000006")).toBeNull();
    const verified = await User.create({ name: "Verified owner", phone: "+919300000006", phoneVerifiedAt: new Date(), passwordHash: "unused" });
    expect(String((await findPhoneIdentity("+919300000006"))!._id)).toBe(String(verified._id));
    await expect(User.create({ name: "Second claim", phone: verified.phone, phoneVerifiedAt: new Date(), passwordHash: "unused" })).rejects.toMatchObject({ code: 11000 });
  });

  it("reports an unexpected replacement index instead of dropping a custom constraint", async () => {
    await users().dropIndex("email_login_unique");
    await users().createIndex({ email: 1 }, { name: "email_login_unique" });
    const report = await migrateAuthIndexes(mongoose.connection.db!, true);
    expect(report.conflicts).toEqual(["email_login_unique"]);
    expect(report.applied).toBe(false);
  });
});
