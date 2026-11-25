import { beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({ send: vi.fn().mockResolvedValue({}), destroy: vi.fn(), signed: vi.fn().mockResolvedValue("https://storage.example.test/signed"), group: vi.fn() }));
vi.mock("../../config/env.js", () => ({ env: { UPLOAD_DRIVER: "local", API_PUBLIC_URL: "http://localhost:4000" } }));
vi.mock("../settings.service.js", () => ({ getDecryptedGroup: mock.group }));
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class { send = mock.send; destroy = mock.destroy },
  PutObjectCommand: class { constructor(public input: unknown) {} },
  GetObjectCommand: class { constructor(public input: unknown) {} },
}));
vi.mock("@aws-sdk/s3-request-presigner", () => ({ getSignedUrl: mock.signed }));

import { storeUpload, sendDigitalFile } from "../upload.service.js";
import { sendPublicS3File } from "../s3-storage.service.js";
const owner = "123456789012345678901234";
const pdf = { buffer: Buffer.from("%PDF-1.7 file"), size: 13, mimetype: "application/pdf", originalname: "file.pdf" };

beforeEach(() => {
  vi.clearAllMocks();
  mock.group.mockResolvedValue({ driver: "s3", bucket: "private-bucket", region: "ap-south-1", accessKeyId: "test-id", secretAccessKey: "test-secret" });
});

describe("S3 upload and download boundary", () => {
  it("uses runtime storage settings and keeps digital goods behind an internal private reference", async () => {
    const file = await storeUpload(pdf, "digital", owner);
    expect(file.url).toBe(`s3-private://private-bucket/${file.key}`);
    expect(mock.send.mock.calls[0]![0].input).toMatchObject({ Bucket: "private-bucket", Key: file.key, ContentType: "application/pdf", CacheControl: "private, no-store" });
    expect(mock.send.mock.calls[0]![0].input.ACL).toBeUndefined();
    const response = { setHeader: vi.fn(), redirect: vi.fn() };
    await sendDigitalFile(file.url, response as never);
    expect(mock.signed).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ input: expect.objectContaining({ Key: file.key, ResponseContentDisposition: "attachment" }) }), { expiresIn: 60 });
    expect(response.setHeader).toHaveBeenCalledWith("Cache-Control", "private, no-store");
    expect(response.redirect).toHaveBeenCalledWith("https://storage.example.test/signed");
  });

  it("serves public references through the API and refuses public requests for private keys", async () => {
    const file = await storeUpload(pdf, "document", owner);
    expect(file.url).toBe(`http://localhost:4000/uploads/s3/private-bucket/${file.key}`);
    await expect(sendPublicS3File("private-bucket", `digital/${owner}/12345678-1234-1234-1234-123456789012.pdf`, {} as never)).rejects.toThrow("File not found");
    await expect(sendPublicS3File("private-bucket", "document/../secret", {} as never)).rejects.toThrow("File not found");
    expect(mock.send).toHaveBeenCalledTimes(1);
  });

  it("rejects renamed executable contents before uploading anything", async () => {
    await expect(storeUpload({ ...pdf, buffer: Buffer.from("<?php echo 1;") }, "document", owner)).rejects.toThrow(/contents/);
    expect(mock.send).not.toHaveBeenCalled();
  });

  it("fails explicitly when a selected S3 driver is missing its bucket", async () => {
    mock.group.mockResolvedValue({ driver: "s3", region: "ap-south-1" });
    await expect(storeUpload(pdf, "digital", owner)).rejects.toThrow(/bucket/);
    expect(mock.send).not.toHaveBeenCalled();
  });
});
