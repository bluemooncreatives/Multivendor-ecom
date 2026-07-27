import "server-only";
import { connectMongo, objectId } from "@/lib/mongodb";
import { BrandModel, CategoryModel, ProductModel, SettingModel, ShopModel } from "@/models";
import { demoBrands, demoCategories, demoProducts, demoShops, demoSliders } from "@/lib/demo-data";
import type { Brand, Category, Product, Shop } from "@/lib/types";
import { salePrice } from "@/lib/utils";

type PlainRecord = Record<string, any>;

function fallbackEnabled(): boolean {
  return process.env.ALLOW_DEMO_DATA === "true" || process.env.NODE_ENV !== "production";
}

function productFromDocument(document: PlainRecord): Product {
  const price = Number(document.unitPrice || 0);
  const discount = Number(document.discount || 0);
  const discountType = document.discountType === "percent" ? "percent" : "amount";
  return {
    id: String(document._id),
    name: String(document.name || "Untitled product"),
    slug: String(document.slug || document._id),
    description: String(document.description || ""),
    categoryId: String(document.category || ""),
    brandId: document.brand ? String(document.brand) : null,
    sellerId: String(document.seller || ""),
    price,
    purchasePrice: Number(document.purchasePrice || 0),
    discount,
    discountType,
    salePrice: salePrice(price, discount, discountType),
    stock: Number(document.stock || 0),
    minQuantity: Math.max(1, Number(document.minQuantity || 1)),
    variants: Array.isArray(document.variants) ? document.variants.map((variant: PlainRecord) => ({ name: String(variant.name || variant.variant || ""), sku: variant.sku ? String(variant.sku) : undefined, price: Number(variant.price ?? price), stock: Math.max(0, Number(variant.stock ?? variant.qty ?? 0)) })).filter((variant: { name: string }) => variant.name) : [],
    unit: String(document.unit || "pc"),
    rating: Number(document.rating || 0),
    sales: Number(document.sales || 0),
    thumbnail: document.thumbnail || null,
    photos: Array.isArray(document.photos) ? document.photos.map(String) : [],
    featured: Boolean(document.featured),
    todaysDeal: Boolean(document.todaysDeal),
    published: Boolean(document.published),
    digital: Boolean(document.digital),
  };
}

function categoryFromDocument(document: PlainRecord): Category {
  return {
    id: String(document._id),
    name: String(document.name),
    slug: String(document.slug || document._id),
    banner: document.banner || null,
    icon: document.icon || null,
    featured: Boolean(document.featured),
    top: Boolean(document.top),
  };
}

function brandFromDocument(document: PlainRecord): Brand {
  return {
    id: String(document._id),
    name: String(document.name),
    slug: String(document.slug || document._id),
    logo: document.logo || null,
    top: Boolean(document.top),
  };
}

function shopFromDocument(document: PlainRecord): Shop {
  return {
    id: String(document._id),
    userId: String(document.owner),
    name: String(document.name),
    slug: String(document.slug || document._id),
    logo: document.logo || null,
    address: document.address || null,
    description: document.metaDescription || null,
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function getProducts(options: { query?: string; category?: string; brand?: string; sellerId?: string; featured?: boolean; deal?: boolean; limit?: number } = {}): Promise<Product[]> {
  try {
    await connectMongo();
    const filter: Record<string, unknown> = { published: true };
    if (options.query?.trim()) {
      const search = new RegExp(escapeRegex(options.query.trim().slice(0, 120)), "i");
      filter.$or = [{ name: search }, { tags: search }, { description: search }];
    }
    if (options.category) {
      const category = await CategoryModel.findOne({ slug: options.category.toLowerCase(), active: true }).select("_id").lean();
      if (!category) return [];
      filter.category = category._id;
    }
    if (options.brand) {
      const brand = await BrandModel.findOne({ slug: options.brand.toLowerCase(), active: true }).select("_id").lean();
      if (!brand) return [];
      filter.brand = brand._id;
    }
    if (options.sellerId) {
      const seller = objectId(options.sellerId);
      if (!seller) return [];
      filter.seller = seller;
    }
    if (options.featured) filter.featured = true;
    if (options.deal) filter.todaysDeal = true;
    const requestedLimit = Number(options.limit || 48);
    const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(Math.trunc(requestedLimit), 1), 500) : 48;
    const documents = await ProductModel.find(filter)
      .sort({ featured: -1, sales: -1, createdAt: -1 })
      .limit(limit)
      .lean();
    return documents.map((document) => productFromDocument(document as PlainRecord));
  } catch (error) {
    if (!fallbackEnabled()) throw error;
    let products = demoProducts.slice();
    if (options.query) products = products.filter((product) => product.name.toLowerCase().includes(options.query!.toLowerCase()));
    if (options.category) {
      const category = demoCategories.find((item) => item.slug.toLowerCase() === options.category!.toLowerCase());
      products = products.filter((product) => product.categoryId === category?.id);
    }
    if (options.brand) {
      const brand = demoBrands.find((item) => item.slug.toLowerCase() === options.brand!.toLowerCase());
      products = products.filter((product) => product.brandId === brand?.id);
    }
    if (options.sellerId) products = products.filter((product) => product.sellerId === options.sellerId);
    if (options.featured) products = products.filter((product) => product.featured);
    if (options.deal) products = products.filter((product) => product.todaysDeal);
    return products.slice(0, options.limit || 48);
  }
}

export async function getProduct(slugOrId: string): Promise<Product | null> {
  try {
    await connectMongo();
    const id = objectId(slugOrId);
    const document = await ProductModel.findOne({
      published: true,
      $or: [{ slug: slugOrId.toLowerCase() }, ...(id ? [{ _id: id }] : [])],
    }).lean();
    return document ? productFromDocument(document as PlainRecord) : null;
  } catch (error) {
    if (!fallbackEnabled()) throw error;
    return demoProducts.find((product) => product.slug.toLowerCase() === slugOrId.toLowerCase() || product.id === slugOrId) || null;
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    await connectMongo();
    const documents = await CategoryModel.find({ active: true, parent: null }).sort({ featured: -1, name: 1 }).lean();
    return documents.map((document) => categoryFromDocument(document as PlainRecord));
  } catch (error) {
    if (!fallbackEnabled()) throw error;
    return demoCategories;
  }
}

export async function getBrands(): Promise<Brand[]> {
  try {
    await connectMongo();
    const documents = await BrandModel.find({ active: true }).sort({ top: -1, name: 1 }).lean();
    return documents.map((document) => brandFromDocument(document as PlainRecord));
  } catch (error) {
    if (!fallbackEnabled()) throw error;
    return demoBrands;
  }
}

export async function getShops(): Promise<Shop[]> {
  try {
    await connectMongo();
    const documents = await ShopModel.find({ active: true, verificationStatus: "approved" }).sort({ createdAt: -1 }).lean();
    return documents.map((document) => shopFromDocument(document as PlainRecord));
  } catch (error) {
    if (!fallbackEnabled()) throw error;
    return demoShops;
  }
}

export async function getShop(slugOrId: string): Promise<Shop | null> {
  try {
    await connectMongo();
    const id = objectId(slugOrId);
    const document = await ShopModel.findOne({ active: true, verificationStatus: "approved", $or: [{ slug: slugOrId.toLowerCase() }, ...(id ? [{ _id: id }] : [])] }).lean();
    return document ? shopFromDocument(document as PlainRecord) : null;
  } catch (error) {
    if (!fallbackEnabled()) throw error;
    return demoShops.find((shop) => shop.slug.toLowerCase() === slugOrId.toLowerCase() || shop.id === slugOrId) || null;
  }
}

export async function getSliders(): Promise<string[]> {
  try {
    await connectMongo();
    const setting = await SettingModel.findOne({ key: "homepage.sliders", public: true }).lean();
    return Array.isArray(setting?.value) && setting.value.length ? setting.value.map(String) : fallbackEnabled() ? demoSliders : [];
  } catch (error) {
    if (!fallbackEnabled()) throw error;
    return demoSliders;
  }
}
