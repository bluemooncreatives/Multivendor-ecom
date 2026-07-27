import type { Brand, Category, Product, Shop } from "@/lib/types";

export const demoCategories: Category[] = [
  { id: "demo-category-women", name: "Women's Fashion", slug: "women-fashion", banner: "uploads/categories/banner/KMGJcwSSTApCZTQLAugOiZAqgSy7yNN9Zd6P3Jh9.png", icon: "uploads/categories/icon/KjJP9wuEZNL184XVUk3S7EiZ8NnBN99kiU4wdvp3.png", featured: true, top: true },
  { id: "demo-category-men", name: "Men's Fashion", slug: "men-fashion", banner: "uploads/categories/banner/EQQaYvBpsSIHJ3qeOlH3Y4MeSySP2gvS0FYQwinZ.png", icon: "uploads/categories/icon/h9XhWwI401u6sRoLITEk9SUMRAlWN8moGrpPfS6I.png", featured: true, top: true },
  { id: "demo-category-home", name: "Home & Kitchen", slug: "home-kitchen", banner: "uploads/categories/banner/A2reyaxxrlumdbt7hg4Y0rhxaMgoHq2hY6VmNlI8.png", icon: "uploads/categories/icon/rKAPw5rNlS84JtD9ZQqn366jwE11qyJqbzAe5yaA.png", featured: true, top: true },
  { id: "demo-category-kids", name: "Kids, Fashion & Toys", slug: "kids-fashion-toys", banner: "uploads/categories/banner/rm7Apca5PZrSwVJjRkSfeWnhZwkzNHuFDvNX6gH0.png", icon: "uploads/categories/icon/IY3vkYTrClFRA7kwQR3vVR7lHaS7jMEvwZpmEbpc.svg", featured: true, top: true },
  { id: "demo-category-sports", name: "Sports & Fitness", slug: "sports-and-fitness", banner: "uploads/categories/banner/9clHADh7z5f1D14L7669UpnocFezyesAZE4aOXDL.png", icon: "uploads/categories/icon/zNj500K2IzUgfZo2Q9jODvwuhVAIEr8O0S9VGLLq.svg", featured: true, top: true },
];

export const demoBrands: Brand[] = [
  { id: "demo-brand-aardra", name: "Aardra Fashion", slug: "aardra-fashion-kurti", logo: "uploads/brands/eNjzwtiK1MdgteHPIP7BBEq2Yni7wv5XdAvIQG4Q.png", top: true },
  { id: "demo-brand-us-polo", name: "US Polo", slug: "us-polo", logo: "uploads/brands/VB2qPddwkfV0sT6Vnkqr4kfLYDbCvcVONu1RP5Yi.jpeg", top: true },
  { id: "demo-brand-zara", name: "Zara", slug: "zara", logo: "uploads/brands/aEMcgvMpl949LHL2GKxoSU7ea9VdxF5axsKbSD5o.jpeg", top: true },
  { id: "demo-brand-pepe", name: "Pepe Jeans", slug: "pepe-jeans", logo: "uploads/brands/yBUHMNcZdQl1bS0eDrQJ9y6Mia5lvbRUJaGEMIeq.jpeg", top: true },
  { id: "demo-brand-levis", name: "Levis", slug: "levis", logo: "uploads/brands/uQLFiNsjBKN2KVUUVRaOngz2jndPjQaqZrHuCJJY.jpeg", top: true },
];

const images = [
  "0aCOHUtWNCEg5MdV0CYf3SwBCjK4Wj7zoyQoAZcv.jpeg",
  "1weRoSK03veLJ4BFOaP7yMomK0AEjYWPJXdAdmQv.jpeg",
  "24fqWFzJwssOxrxnjniVJxOUTyQuHrJVDsjqU33m.jpeg",
  "2ITfYqIBvl4aK3ysVQSagLaRzFnqyJQePSmjBrHm.jpeg",
  "2NlLmcS3zTCviXjDBbRP5C8hYYp5H7Xwy4Gp0y8a.jpeg",
  "36Fx4OKDSWbuuVwJTSLIzS9KtjtcTuwmBtbnBBQH.jpeg",
  "3iqfte8Qt5yhlaO4quFUcadYZkrwqqpKlYXjstEl.jpeg",
  "3RtnxamKMG3NX9MANhN8ZbzTtfAFigIj3m8lU6OP.jpeg",
];

const productSeed = [
  ["demo-product-jeans", "Slim Fit Jeans", "slim-fit-jeans", "demo-category-men", "demo-brand-us-polo", 3100, "demo-seller-reruns", "Classic slim-fit denim with a comfortable everyday cut."],
  ["demo-product-rayon", "Rayon Slub Handwork Pant Set", "rayon-slub-handwork-pant-set", "demo-category-women", "demo-brand-aardra", 835, "demo-seller-dreamz", "Elegant rayon pant set finished with handcrafted details."],
  ["demo-product-zipper", "Performance Sports Zipper", "performance-sports-zipper", "demo-category-men", null, 1200, "demo-seller-angel", "Lightweight sports jacket for training and casual wear."],
  ["demo-product-tshirt", "Four-Way Stretch T-Shirt", "four-way-stretch-tshirt", "demo-category-men", "demo-brand-us-polo", 699, "demo-seller-angel", "Breathable stretch fabric designed for all-day movement."],
  ["demo-product-kurti", "Printed Rayon Kurti", "printed-rayon-kurti", "demo-category-women", "demo-brand-aardra", 899, "demo-seller-kuthe", "Soft rayon kurti with a modern artisan print."],
  ["demo-product-organizer", "Everyday Home Organizer", "everyday-home-organizer", "demo-category-home", null, 640, "demo-seller-local", "A practical organizer that keeps essentials tidy and accessible."],
  ["demo-product-play", "Kids Creative Play Set", "kids-creative-play-set", "demo-category-kids", null, 390, "demo-seller-local", "A colorful activity set for imaginative, screen-free play."],
  ["demo-product-jersey", "Cycling Training Jersey", "cycling-training-jersey", "demo-category-sports", null, 1200, "demo-seller-cycle", "Quick-dry performance jersey for daily cycling."],
] as const;

export const demoProducts: Product[] = productSeed.map((item, index) => ({
  id: item[0],
  name: item[1],
  slug: item[2],
  categoryId: item[3],
  brandId: item[4],
  price: item[5],
  purchasePrice: item[5] * 0.65,
  sellerId: item[6],
  description: item[7],
  discount: index % 3 === 0 ? 10 : index % 3 === 1 ? 50 : 0,
  discountType: index % 3 === 0 ? "percent" : "amount",
  salePrice: index % 3 === 0 ? item[5] * 0.9 : index % 3 === 1 ? item[5] - 50 : item[5],
  stock: 10 + index * 4,
  minQuantity: 1,
  variants: [],
  unit: "pc",
  rating: 4 + (index % 5) * 0.2,
  sales: 18 + index * 7,
  thumbnail: `uploads/products/thumbnail/${images[index]}`,
  photos: [`uploads/products/thumbnail/${images[index]}`],
  featured: index < 6,
  todaysDeal: index < 4,
  published: true,
  digital: false,
}));

export const demoShops: Shop[] = [
  { id: "demo-shop-aardra", userId: "demo-seller-aardra", name: "Aardra Fashion", slug: "aardra-fashion", logo: "uploads/shop/logo/sAkRZDhaHbIgY9DWM7pYDi3m18tG2IAqjDtBBXP4.png", address: "Ahmedabad, Gujarat", description: "Contemporary local fashion and handcrafted clothing." },
  { id: "demo-shop-kuthe", userId: "demo-seller-kuthe", name: "KUTHESHOP", slug: "kutheshop", logo: "uploads/shop/logo/bOKYTqbVVEiU0QARvFwZfcXzoq3nz2fdkqPZOOR8.jpeg", address: "Bhuj, Gujarat", description: "Fashion, accessories and sports products from a local seller." },
  { id: "demo-shop-shrujvi", userId: "demo-seller-shrujvi", name: "Shrujvi's Collection", slug: "shrujvis-collection", logo: "uploads/shop/logo/WG7CpvDspWM7yIuI4I8JQMTvy5oGvOfAItu8Wf6s.jpeg", address: "Vadodara, Gujarat", description: "Clothing, jewellery, beauty and home collections." },
];

export const demoSliders = [
  "uploads/sliders/nhPRjDm3jpe8icXAJrlxtEGpKhD3V0aP6Tzo20dI.png",
  "uploads/sliders/9A6PmVeW1piWauc97Hf7WwFtpqz1QMTzoNSKi1ps.png",
  "uploads/sliders/77KmfR3MWAIbdsRwABHsIWtielndojzuV2Ql0NwG.png",
];
