import mongoose, { type Model } from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { connectMongo, isMongoDuplicate, objectId } from "@/lib/mongodb";
import type { SessionUser } from "@/lib/types";
import { entityDefinitions, isEntityName, type EntityDefinition, type EntityName } from "@/lib/workspace";
import {
  AddressModel, AuditLogModel, BrandModel, CategoryModel, ConversationModel, CouponModel,
  OrderModel, ProductModel, ReviewModel, SettingModel, ShopModel, TicketModel, User,
  WalletTransactionModel, WishlistModel,
} from "@/models";

export const runtime = "nodejs";

const bodySchema = z.record(z.string().max(100), z.unknown());
type Action = "read" | "create" | "update" | "delete";
type Access = SessionUser | "unauthenticated" | "forbidden";

const coreModels: Partial<Record<EntityName, Model<any>>> = {
  products: ProductModel, categories: CategoryModel, sub_categories: CategoryModel, sub_sub_categories: CategoryModel,
  brands: BrandModel, orders: OrderModel, order_details: OrderModel, sellers: User, customers: User, staff: User,
  reviews: ReviewModel, payments: WalletTransactionModel, wallets: WalletTransactionModel, coupons: CouponModel,
  tickets: TicketModel, conversations: ConversationModel, wishlists: WishlistModel, shops: ShopModel, addresses: AddressModel,
  general_settings: SettingModel, business_settings: SettingModel,
};

async function authorize(entity: EntityName, action: Action): Promise<Access> {
  const user = await getSession();
  if (!user) return "unauthenticated";
  if (user.role === "admin" || user.role === "staff") return user;
  if (user.role === "seller" && (entity === "products" || (entity === "shops" && (action === "read" || action === "update")))) return user;
  return "forbidden";
}

function accessFailure(access: Access): NextResponse | null {
  if (access === "unauthenticated") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (access === "forbidden") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  return null;
}

function writableFields(definition: EntityDefinition): string[] {
  return definition.fields.filter((field) => !["_id", "createdAt", "updatedAt", "deletedAt"].includes(field) && !field.includes(".") && !Object.prototype.hasOwnProperty.call(definition.baseFilter || {}, field));
}

function coerceValue(field: string, value: unknown, definition: EntityDefinition): unknown {
  if (!definition.objectIdFields?.includes(field)) return value;
  if (Array.isArray(value)) return value.map((item) => typeof item === "string" ? objectId(item) : null).filter(Boolean);
  if (value === null || value === "") return null;
  if (typeof value === "string") return objectId(value);
  return value;
}

function literalDefaults(definition: EntityDefinition): Record<string, unknown> {
  return Object.fromEntries(Object.entries(definition.baseFilter || {}).filter(([, value]) => value === null || typeof value !== "object" || value instanceof mongoose.Types.ObjectId));
}

function ownershipFilter(user: SessionUser, entity: EntityName): Record<string, unknown> {
  if (user.role !== "seller") return {};
  const id = objectId(user.id);
  if (!id) return { _id: null };
  if (entity === "products") return { seller: id };
  if (entity === "shops") return { owner: id };
  return { _id: null };
}

function scopedFilter(definition: EntityDefinition, user: SessionUser, entity: EntityName, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return { ...(definition.baseFilter || {}), ...ownershipFilter(user, entity), ...extra };
}

function auditContext(request: Request) {
  return {
    ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    userAgent: request.headers.get("user-agent")?.slice(0, 500),
  };
}

async function recordAudit(request: Request, user: SessionUser, action: Action, entity: EntityName, entityId: string, changes: Record<string, unknown>) {
  await AuditLogModel.create({ actor: objectId(user.id), action, entity, entityId, changes, ...auditContext(request) }).catch(() => undefined);
}

function mutationBlocked(definition: EntityDefinition, action: Action): NextResponse | null {
  if (definition.readOnly) return NextResponse.json({ message: "This collection is read-only. Use its dedicated workflow." }, { status: 405 });
  if (action === "create" && definition.createDisabled) return NextResponse.json({ message: "Records in this collection must be created through their dedicated workflow." }, { status: 405 });
  if (action === "delete" && definition.deleteDisabled) return NextResponse.json({ message: "Records in this collection cannot be deleted." }, { status: 405 });
  return null;
}

function missingRequired(document: Record<string, unknown>, definition: EntityDefinition, user: SessionUser, entity: EntityName): string | null {
  for (const field of definition.requiredFields || []) {
    if (user.role === "seller" && entity === "products" && field === "seller") continue;
    if (document[field] === undefined || document[field] === null || document[field] === "") return field;
  }
  return null;
}

export async function GET(request: Request, { params }: { params: Promise<{ entity: string }> }) {
  const { entity } = await params;
  if (!isEntityName(entity)) return NextResponse.json({ message: "Unknown entity" }, { status: 404 });
  const access = await authorize(entity, "read");
  const failure = accessFailure(access);
  if (failure || typeof access === "string") return failure!;
  try {
    await connectMongo();
    const definition: EntityDefinition = entityDefinitions[entity];
    const id = new URL(request.url).searchParams.get("id");
    const idValue = id ? objectId(id) : null;
    if (id && !idValue) return NextResponse.json({ message: "Invalid record id" }, { status: 400 });
    const filter = scopedFilter(definition, access, entity, idValue ? { _id: idValue } : {});
    const projection = Object.fromEntries(definition.fields.map((field) => [field, 1]));
    const data = await mongoose.connection.db!.collection(definition.collection).find(filter, { projection }).sort({ createdAt: -1, _id: -1 }).limit(idValue ? 1 : 100).toArray();
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ message: "MongoDB is unavailable" }, { status: 503 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ entity: string }> }) {
  const { entity } = await params;
  if (!isEntityName(entity)) return NextResponse.json({ message: "Unknown entity" }, { status: 404 });
  const definition: EntityDefinition = entityDefinitions[entity];
  const blocked = mutationBlocked(definition, "create");
  if (blocked) return blocked;
  const access = await authorize(entity, "create");
  const failure = accessFailure(access);
  if (failure || typeof access === "string") return failure!;
  try {
    const body = bodySchema.parse(await request.json());
    await connectMongo();
    const document: Record<string, unknown> = literalDefaults(definition);
    for (const field of writableFields(definition)) if (body[field] !== undefined) document[field] = coerceValue(field, body[field], definition);
    if (access.role === "seller" && entity === "products") { document.seller = objectId(access.id); document.addedBy = "seller"; }
    const missing = missingRequired(document, definition, access, entity);
    if (missing) return NextResponse.json({ message: `${missing} is required` }, { status: 400 });
    document.createdAt = new Date();
    document.updatedAt = new Date();
    const model = coreModels[entity];
    const created = model ? await model.create(document) : null;
    const insertedId = created?._id || (await mongoose.connection.db!.collection(definition.collection).insertOne(document)).insertedId;
    await recordAudit(request, access, "create", entity, String(insertedId), document);
    return NextResponse.json({ id: String(insertedId) }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
    if (isMongoDuplicate(error)) return NextResponse.json({ message: "A record with the same unique value already exists." }, { status: 409 });
    return NextResponse.json({ message: error instanceof Error ? error.message : "Record could not be created" }, { status: 400 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ entity: string }> }) {
  const { entity } = await params;
  if (!isEntityName(entity)) return NextResponse.json({ message: "Unknown entity" }, { status: 404 });
  const definition: EntityDefinition = entityDefinitions[entity];
  const blocked = mutationBlocked(definition, "update");
  if (blocked) return blocked;
  const access = await authorize(entity, "update");
  const failure = accessFailure(access);
  if (failure || typeof access === "string") return failure!;
  try {
    const body = bodySchema.parse(await request.json());
    const id = typeof body.id === "string" ? objectId(body.id) : null;
    if (!id) return NextResponse.json({ message: "A valid id is required" }, { status: 400 });
    await connectMongo();
    const changes: Record<string, unknown> = {};
    for (const field of writableFields(definition)) if (body[field] !== undefined) changes[field] = coerceValue(field, body[field], definition);
    if (access.role === "seller" && entity === "products") { delete changes.seller; delete changes.addedBy; }
    if (access.role === "seller" && entity === "shops") { delete changes.owner; delete changes.verificationStatus; delete changes.active; }
    if (!Object.keys(changes).length) return NextResponse.json({ message: "No valid fields" }, { status: 400 });
    changes.updatedAt = new Date();
    const filter = scopedFilter(definition, access, entity, { _id: id });
    const model = coreModels[entity];
    const result = model
      ? await model.updateOne(filter, { $set: changes }, { runValidators: true })
      : await mongoose.connection.db!.collection(definition.collection).updateOne(filter, { $set: changes });
    if (!result.matchedCount) return NextResponse.json({ message: "Record not found" }, { status: 404 });
    await recordAudit(request, access, "update", entity, String(id), changes);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
    if (isMongoDuplicate(error)) return NextResponse.json({ message: "A record with the same unique value already exists." }, { status: 409 });
    return NextResponse.json({ message: error instanceof Error ? error.message : "Record could not be updated" }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ entity: string }> }) {
  const { entity } = await params;
  if (!isEntityName(entity)) return NextResponse.json({ message: "Unknown entity" }, { status: 404 });
  const definition: EntityDefinition = entityDefinitions[entity];
  const blocked = mutationBlocked(definition, "delete");
  if (blocked) return blocked;
  const access = await authorize(entity, "delete");
  const failure = accessFailure(access);
  if (failure || typeof access === "string") return failure!;
  const id = objectId(new URL(request.url).searchParams.get("id") || "");
  if (!id) return NextResponse.json({ message: "A valid id is required" }, { status: 400 });
  if (definition.collection === "users" && String(id) === access.id) return NextResponse.json({ message: "You cannot delete your own account." }, { status: 409 });
  try {
    await connectMongo();
    const collection = mongoose.connection.db!.collection(definition.collection);
    const softDelete: Partial<Record<EntityName, Record<string, unknown>>> = {
      products: { published: false, deletedAt: new Date(), updatedAt: new Date() },
      categories: { active: false, deletedAt: new Date(), updatedAt: new Date() },
      sub_categories: { active: false, deletedAt: new Date(), updatedAt: new Date() },
      sub_sub_categories: { active: false, deletedAt: new Date(), updatedAt: new Date() },
      brands: { active: false, deletedAt: new Date(), updatedAt: new Date() },
      sellers: { status: "deleted", deletedAt: new Date(), updatedAt: new Date() },
      customers: { status: "deleted", deletedAt: new Date(), updatedAt: new Date() },
      staff: { status: "deleted", deletedAt: new Date(), updatedAt: new Date() },
    };
    const filter = scopedFilter(definition, access, entity, { _id: id });
    const result = softDelete[entity]
      ? await collection.updateOne(filter, { $set: softDelete[entity] })
      : await collection.deleteOne(filter);
    const changed = "matchedCount" in result ? result.matchedCount : result.deletedCount;
    if (!changed) return NextResponse.json({ message: "Record not found" }, { status: 404 });
    await recordAudit(request, access, "delete", entity, String(id), softDelete[entity] || { deleted: true });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: "Record could not be deleted" }, { status: 409 });
  }
}
