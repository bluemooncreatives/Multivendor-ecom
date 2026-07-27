import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

function extension(buffer: Buffer): "png" | "jpg" | "webp" | null {
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))) return "png";
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpg";
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return "webp";
  return null;
}

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!(["seller", "admin", "staff"] as string[]).includes(user.role)) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ message: "Choose an image file." }, { status: 400 });
    if (file.size <= 0 || file.size > 5 * 1024 * 1024) return NextResponse.json({ message: "Images must be between 1 byte and 5 MB." }, { status: 413 });
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = extension(buffer);
    if (!ext) return NextResponse.json({ message: "Only PNG, JPEG, and WebP images are accepted." }, { status: 415 });
    const relativeDirectory = "uploads/products/media";
    const directory = path.resolve(process.cwd(), "public", ...relativeDirectory.split("/"));
    const publicRoot = path.resolve(process.cwd(), "public");
    if (!directory.startsWith(`${publicRoot}${path.sep}`)) throw new Error("Unsafe upload path");
    await fs.mkdir(directory, { recursive: true });
    const name = `${Date.now()}-${crypto.randomBytes(12).toString("hex")}.${ext}`;
    await fs.writeFile(path.join(directory, name), buffer, { flag: "wx" });
    return NextResponse.json({ path: `${relativeDirectory}/${name}` }, { status: 201 });
  } catch { return NextResponse.json({ message: "The image could not be stored." }, { status: 500 }); }
}
