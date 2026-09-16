/**
 * Fixture data for `USE_MOCK_API=true`.
 *
 * These objects deliberately match the *wire* format of the POS API (snake_case,
 * nested `pricing`/`stock`), so mock mode flows through exactly the same
 * validators and normalizers as a real response. Nothing here is reachable when
 * `USE_MOCK_API=false`.
 */

export interface WireCategory {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  slug: string;
  product_count: number;
}

export interface WireProduct {
  id: number;
  name: string;
  sku: string | null;
  barcode: string | null;
  description: string | null;
  category: { id: number; name: string; color: string | null } | null;
  sell_type: string;
  sale_unit: string | null;
  purchase_unit: string | null;
  pcs_per_box: number;
  pricing: { sale_price: number; sale_price_box: number; tax_percent: number };
  stock: { qty: number; boxes: number; pieces: number; low_alert: number; status: string };
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

interface CategorySeed {
  id: number;
  name: string;
  slug: string;
  color: string;
  icon: string;
  description: string;
}

const CATEGORY_SEED: CategorySeed[] = [
  {
    id: 1,
    name: "Fruits",
    slug: "fruits",
    color: "#e0673f",
    icon: "apple",
    description: "Fresh fruit, delivered daily from the market.",
  },
  {
    id: 2,
    name: "Drinks",
    slug: "drinks",
    color: "#2f7d4f",
    icon: "cup-soda",
    description: "Juices, sodas and everything cold.",
  },
  {
    id: 3,
    name: "Water",
    slug: "water",
    color: "#2a7fb8",
    icon: "droplets",
    description: "Still and sparkling mineral water.",
  },
  {
    id: 4,
    name: "Coffee",
    slug: "coffee",
    color: "#7a5230",
    icon: "coffee",
    description: "Beans, ground coffee and capsules.",
  },
  {
    id: 5,
    name: "Snacks",
    slug: "snacks",
    color: "#c9962c",
    icon: "cookie",
    description: "Crisps, biscuits and chocolate.",
  },
  {
    id: 6,
    name: "Groceries",
    slug: "groceries",
    color: "#8a6d3b",
    icon: "wheat",
    description: "Pantry basics: pasta, rice, oil and tins.",
  },
  {
    id: 7,
    name: "Household",
    slug: "household",
    color: "#5a6b7a",
    icon: "spray-can",
    description: "Cleaning, washing liquids and paper goods.",
  },
  {
    id: 8,
    name: "Hygiene",
    slug: "hygiene",
    color: "#a4557e",
    icon: "heart-pulse",
    description: "Sanitary and personal care products.",
  },
  {
    id: 9,
    name: "Pet Food",
    slug: "pet-food",
    color: "#a5773a",
    icon: "paw-print",
    description: "Food and treats for cats and dogs.",
  },
  {
    id: 10,
    name: "Cigarettes",
    slug: "cigarettes",
    color: "#4a4a4a",
    icon: "cigarette",
    description: "Age-restricted. Sold in store only.",
  },
];

/** A real, publicly reachable Cloudinary demo image, used to exercise remote images. */
const SAMPLE_IMAGE = "https://res.cloudinary.com/demo/image/upload/w_800,q_auto,f_auto/sample.jpg";
const SAMPLE_IMAGE_ALT =
  "https://res.cloudinary.com/demo/image/upload/w_800,q_auto,f_auto/cld-sample.jpg";

interface ProductSeed {
  name: string;
  categoryId: number;
  sku: string;
  price: number;
  boxPrice?: number;
  pcsPerBox?: number;
  sellType?: "piece" | "box" | "both";
  qty: number;
  lowAlert?: number;
  unit?: string;
  purchaseUnit?: string;
  image?: string | null;
  description?: string;
}

const PRODUCT_SEED: ProductSeed[] = [
  // Fruits
  {
    name: "Bananas",
    categoryId: 1,
    sku: "FRU-001",
    price: 1.49,
    qty: 48,
    unit: "kg",
    lowAlert: 8,
    image: SAMPLE_IMAGE,
    description: "Sweet and ripe, sold by weight.",
  },
  {
    name: "Gala Apples",
    categoryId: 1,
    sku: "FRU-002",
    price: 2.19,
    qty: 30,
    unit: "kg",
    lowAlert: 6,
    image: SAMPLE_IMAGE_ALT,
  },
  { name: "Oranges", categoryId: 1, sku: "FRU-003", price: 1.79, qty: 5, lowAlert: 8, unit: "kg" },
  {
    name: "Strawberries",
    categoryId: 1,
    sku: "FRU-004",
    price: 3.49,
    qty: 0,
    lowAlert: 4,
    unit: "box",
  },
  { name: "Lemons", categoryId: 1, sku: "FRU-005", price: 2.49, qty: 22, unit: "kg", lowAlert: 5 },

  // Drinks
  {
    name: "Orange Juice 1L",
    categoryId: 2,
    sku: "DRK-001",
    price: 2.35,
    boxPrice: 21.9,
    pcsPerBox: 12,
    sellType: "both",
    qty: 36,
    unit: "un",
    purchaseUnit: "box",
    lowAlert: 6,
  },
  {
    name: "Sparkling Lemonade 330ml",
    categoryId: 2,
    sku: "DRK-002",
    price: 0.89,
    boxPrice: 16.9,
    pcsPerBox: 24,
    sellType: "both",
    qty: 120,
    unit: "un",
    purchaseUnit: "box",
  },
  {
    name: "Iced Tea Peach 500ml",
    categoryId: 2,
    sku: "DRK-003",
    price: 1.29,
    boxPrice: 11.9,
    pcsPerBox: 12,
    sellType: "both",
    qty: 3,
    unit: "un",
    lowAlert: 12,
  },

  // Water
  {
    name: "Still Water 1.5L",
    categoryId: 3,
    sku: "WTR-001",
    price: 0.59,
    boxPrice: 8.9,
    pcsPerBox: 6,
    sellType: "both",
    qty: 200,
    unit: "un",
    purchaseUnit: "pack",
  },
  {
    name: "Sparkling Water 1L",
    categoryId: 3,
    sku: "WTR-002",
    price: 0.79,
    boxPrice: 9.9,
    pcsPerBox: 6,
    sellType: "both",
    qty: 90,
    unit: "un",
    purchaseUnit: "pack",
  },

  // Coffee
  { name: "Ground Coffee 250g", categoryId: 4, sku: "COF-001", price: 4.99, qty: 24, lowAlert: 4 },
  {
    name: "Espresso Capsules ×10",
    categoryId: 4,
    sku: "COF-002",
    price: 5.49,
    qty: 2,
    lowAlert: 6,
  },
  { name: "Instant Coffee 200g", categoryId: 4, sku: "COF-003", price: 6.29, qty: 14, lowAlert: 3 },

  // Snacks
  { name: "Salted Crisps 150g", categoryId: 5, sku: "SNK-001", price: 1.79, qty: 60, lowAlert: 10 },
  { name: "Milk Chocolate 100g", categoryId: 5, sku: "SNK-002", price: 1.29, qty: 80 },
  { name: "Butter Biscuits 200g", categoryId: 5, sku: "SNK-003", price: 1.15, qty: 0, lowAlert: 6 },

  // Groceries
  { name: "Spaghetti 500g", categoryId: 6, sku: "GRO-001", price: 1.09, qty: 140, lowAlert: 12 },
  { name: "Long Grain Rice 1kg", categoryId: 6, sku: "GRO-002", price: 1.89, qty: 75 },
  { name: "Olive Oil 750ml", categoryId: 6, sku: "GRO-003", price: 7.49, qty: 18, lowAlert: 5 },
  {
    name: "Chopped Tomatoes 400g",
    categoryId: 6,
    sku: "GRO-004",
    price: 0.95,
    qty: 96,
    lowAlert: 12,
  },

  // Household
  {
    name: "Washing Liquid 2L",
    categoryId: 7,
    sku: "HOU-001",
    price: 4.29,
    boxPrice: 22.9,
    pcsPerBox: 6,
    sellType: "both",
    qty: 40,
    purchaseUnit: "box",
    lowAlert: 6,
  },
  {
    name: "Dishwasher Tablets ×30",
    categoryId: 7,
    sku: "HOU-002",
    price: 6.99,
    qty: 4,
    lowAlert: 6,
  },
  { name: "Kitchen Paper ×4", categoryId: 7, sku: "HOU-003", price: 2.79, qty: 55 },
  { name: "Glass Cleaner 500ml", categoryId: 7, sku: "HOU-004", price: 2.19, qty: 26, lowAlert: 5 },

  // Hygiene
  { name: "Toothpaste 75ml", categoryId: 8, sku: "HYG-001", price: 2.49, qty: 48 },
  { name: "Shower Gel 500ml", categoryId: 8, sku: "HYG-002", price: 3.29, qty: 12, lowAlert: 4 },
  { name: "Sanitary Pads ×20", categoryId: 8, sku: "HYG-003", price: 3.99, qty: 34 },

  // Pet food
  { name: "Adult Cat Food 2kg", categoryId: 9, sku: "PET-001", price: 9.99, qty: 16, lowAlert: 3 },
  { name: "Dog Treats 200g", categoryId: 9, sku: "PET-002", price: 3.49, qty: 9, lowAlert: 3 },

  // Cigarettes (age-restricted when enabled via config)
  {
    name: "Cigarettes — 20 pack",
    categoryId: 10,
    sku: "AGE-001",
    price: 5.6,
    qty: 40,
    lowAlert: 10,
  },
];

function productFromSeed(
  seed: ProductSeed,
  index: number,
  categories: WireCategory[],
): WireProduct {
  const category = categories.find((item) => item.id === seed.categoryId) ?? null;
  const lowAlert = seed.lowAlert ?? 5;
  const status = seed.qty <= 0 ? "out_of_stock" : seed.qty <= lowAlert ? "low_stock" : "in_stock";
  const pcsPerBox = seed.pcsPerBox ?? 1;
  const sellType = seed.sellType ?? "piece";

  return {
    id: index + 1,
    name: seed.name,
    sku: seed.sku,
    barcode: `59000000000${String(index + 1).padStart(2, "0")}`,
    description: seed.description ?? null,
    category: category ? { id: category.id, name: category.name, color: category.color } : null,
    sell_type: sellType,
    sale_unit: seed.unit ?? "un",
    purchase_unit: seed.purchaseUnit ?? null,
    pcs_per_box: pcsPerBox,
    pricing: {
      sale_price: seed.price,
      sale_price_box: seed.boxPrice ?? 0,
      tax_percent: 0,
    },
    stock: {
      qty: seed.qty,
      boxes: pcsPerBox > 1 ? Math.floor(seed.qty / pcsPerBox) : seed.qty,
      pieces: seed.qty,
      low_alert: lowAlert,
      status,
    },
    image_url: seed.image === undefined ? null : seed.image,
    created_at: "2026-01-12T09:15:00+00:00",
    updated_at: "2026-02-03T14:40:00+00:00",
  };
}

function countProducts(categoryId: number): number {
  return PRODUCT_SEED.filter((seed) => seed.categoryId === categoryId && seed.qty > 0).length;
}

export const MOCK_CATEGORIES: WireCategory[] = CATEGORY_SEED.map((seed) => ({
  id: seed.id,
  name: seed.name,
  description: seed.description,
  color: seed.color,
  icon: seed.icon,
  slug: seed.slug,
  product_count: countProducts(seed.id),
}));

export const MOCK_PRODUCTS: WireProduct[] = PRODUCT_SEED.map((seed, index) =>
  productFromSeed(seed, index, MOCK_CATEGORIES),
);
