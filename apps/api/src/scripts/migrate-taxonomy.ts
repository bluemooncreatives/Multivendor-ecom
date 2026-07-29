import "dotenv/config";
import { connectDb, disconnectDb } from "../config/db.js";
import { logger } from "../config/logger.js";
import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";

// Backfill for the 3-level taxonomy. Categories predating it have `level` but no
// `ancestors`, and products carry only a flat `categoryId` with no record of which
// sub/sub-sub node it sits under. Both are derived here from the parentId chain.
//
// Idempotent: re-running recomputes the same values, so it is safe to run after
// every import of the legacy export.
async function migrate() {
  await connectDb();

  // --- Categories: rebuild ancestors + level top-down -------------------------
  // Walking level by level guarantees a parent is already correct before any of
  // its children are visited, so one pass is enough regardless of tree shape.
  let categoriesTouched = 0;
  for (const level of [0, 1, 2] as const) {
    const categories = await Category.find({ level });
    for (const category of categories) {
      const ancestors: unknown[] = [];
      if (category.parentId) {
        const parent = await Category.findById(category.parentId, { ancestors: 1, level: 1 });
        if (!parent) {
          logger.warn(`Orphaned category ${String(category._id)}: parent missing, promoting to root`);
          category.parentId = null;
          category.level = 0;
        } else {
          ancestors.push(...parent.ancestors, parent._id);
          category.level = (parent.level + 1) as 0 | 1 | 2;
        }
      } else {
        category.level = 0;
      }

      category.ancestors = ancestors as never;
      if (category.isModified()) {
        await category.save();
        categoriesTouched += 1;
      }
    }
  }

  // --- Products: derive the sub / sub-sub ids from the chosen node ------------
  let productsTouched = 0;
  const cursor = Product.find({}, { categoryId: 1, subCategoryId: 1, subSubCategoryId: 1 }).cursor();

  for await (const product of cursor) {
    const category = await Category.findById(product.categoryId, { ancestors: 1 });
    if (!category) {
      logger.warn(`Product ${String(product._id)} references a missing category; left unchanged`);
      continue;
    }

    // chain is root -> ... -> chosen node. categoryId already holds the deepest
    // node, so only the two coarser slots need filling.
    const chain = [...category.ancestors.map(String), String(category._id)];
    const subCategoryId = chain.length > 1 ? chain[1] : null;
    const subSubCategoryId = chain.length > 2 ? chain[2] : null;

    if (String(product.subCategoryId ?? "") === String(subCategoryId ?? "") &&
        String(product.subSubCategoryId ?? "") === String(subSubCategoryId ?? "")) {
      continue;
    }

    await Product.updateOne({ _id: product._id }, { subCategoryId, subSubCategoryId });
    productsTouched += 1;
  }

  logger.info(`Taxonomy backfill complete: ${categoriesTouched} categories, ${productsTouched} products updated`);
  await disconnectDb();
}

migrate().catch((error) => {
  logger.error(`Taxonomy backfill failed: ${error instanceof Error ? error.stack : String(error)}`);
  process.exit(1);
});
