import { PrismaClient, ProductAvailability } from '@prisma/client';

export interface SeedCategory {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  displayOrder: number;
}

export interface SeedProductImage {
  url: string;
  altText: string;
  displayOrder: number;
  isPrimary: boolean;
}

export interface SeedProduct {
  sku: string;
  name: string;
  slug: string;
  categorySlug: string;
  shortDescription: string;
  description: string;
  price: number; // in paise
  compareAtPrice: number | null; // in paise
  availability: ProductAvailability;
  stockQuantity: number;
  dimensions: string;
  material: string;
  weightGrams: number;
  isHandmade: boolean;
  isFeatured: boolean;
  metaTitle: string;
  metaDescription: string;
  images: SeedProductImage[];
}

export const SEED_CATEGORIES: SeedCategory[] = [
  {
    name: 'Mandala Art',
    slug: 'mandala-art',
    description:
      'Intricate spiritual and sacred geometric circle artworks crafted with meditative precision and acrylic detailing.',
    imageUrl:
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    displayOrder: 1,
  },
  {
    name: 'Lippan Art',
    slug: 'lippan-art',
    description:
      'Traditional Gujarati mud-relief and mirror wall art capturing authentic heritage aesthetics and reflective beauty.',
    imageUrl:
      'https://images.unsplash.com/photo-1582562124811-c09040d0a901?auto=format&fit=crop&w=800&q=80',
    displayOrder: 2,
  },
  {
    name: 'Handmade Paintings',
    slug: 'handmade-paintings',
    description:
      'Original hand-painted acrylic and textured canvases celebrating Indian nature, heritage, and contemporary motifs.',
    imageUrl:
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
    displayOrder: 3,
  },
];

export const SEED_PRODUCTS: SeedProduct[] = [
  // --- Mandala Art (4 products) ---
  {
    sku: 'MND-LOTUS-01',
    name: 'Sacred Lotus Mandala',
    slug: 'sacred-lotus-mandala',
    categorySlug: 'mandala-art',
    shortDescription: 'Intricate lotus mandala on canvas with sacred geometry motifs.',
    description:
      'A masterfully detailed 12x12 inch sacred mandala featuring delicate lotus petal layers, finished in calming jewel tones with fine metallic gold dot accents on stretched canvas.',
    price: 149900, // ₹1,499.00
    compareAtPrice: 199900, // ₹1,999.00
    availability: ProductAvailability.IN_STOCK,
    stockQuantity: 3,
    dimensions: '12 × 12 inches',
    material: 'Acrylic & gold pigment on stretched cotton canvas',
    weightGrams: 850,
    isHandmade: true,
    isFeatured: true,
    metaTitle: 'Sacred Lotus Mandala Art | Mandala Art Store',
    metaDescription:
      'Buy original handmade Sacred Lotus Mandala painting with fine gold detailing. Ready to hang.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
        altText: 'Sacred Lotus Mandala full front view',
        displayOrder: 0,
        isPrimary: true,
      },
      {
        url: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901?auto=format&fit=crop&w=800&q=80',
        altText: 'Sacred Lotus Mandala textured angle detail',
        displayOrder: 1,
        isPrimary: false,
      },
      {
        url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
        altText: 'Sacred Lotus Mandala displayed on a living room wall',
        displayOrder: 2,
        isPrimary: false,
      },
    ],
  },
  {
    sku: 'MND-SUN-02',
    name: 'Golden Sunburst Mandala',
    slug: 'golden-sunburst-mandala',
    categorySlug: 'mandala-art',
    shortDescription: 'Vibrant solar mandala painted on deep wood panel.',
    description:
      'Radiant sunburst mandala with radiating geometric concentric rings in ochre, vermilion, and 24k-style leafing over a rich dark charcoal background.',
    price: 249900, // ₹2,499.00
    compareAtPrice: 299900, // ₹2,999.00
    availability: ProductAvailability.IN_STOCK,
    stockQuantity: 2,
    dimensions: '16 × 16 inches',
    material: 'Gold leaf & acrylic on engineered wood panel',
    weightGrams: 1200,
    isHandmade: true,
    isFeatured: true,
    metaTitle: 'Golden Sunburst Mandala Panel | Mandala Art Store',
    metaDescription:
      'Hand-painted Golden Sunburst Mandala on dark wood panel. Radiant spiritual wall centerpiece.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
        altText: 'Golden Sunburst Mandala overview',
        displayOrder: 0,
        isPrimary: true,
      },
      {
        url: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901?auto=format&fit=crop&w=800&q=80',
        altText: 'Golden Sunburst Mandala close-up of gold leaf work',
        displayOrder: 1,
        isPrimary: false,
      },
    ],
  },
  {
    sku: 'MND-HARMONY-03',
    name: 'Geometric Harmony Mandala',
    slug: 'geometric-harmony-mandala',
    categorySlug: 'mandala-art',
    shortDescription: 'Monochromatic fine-liner mandala with intricate symmetry.',
    description:
      'Crafted with archival pigment ink and high-contrast monochrome design, exploring perfect fractal harmony and balance.',
    price: 189900, // ₹1,899.00
    compareAtPrice: null,
    availability: ProductAvailability.MADE_TO_ORDER,
    stockQuantity: 5,
    dimensions: '14 × 14 inches',
    material: 'Archival pigment ink on 300 GSM cotton rag paper',
    weightGrams: 600,
    isHandmade: true,
    isFeatured: false,
    metaTitle: 'Geometric Harmony Mandala Artwork | Mandala Art Store',
    metaDescription:
      'Made-to-order Geometric Harmony monochrome mandala. Custom crafted in 7–10 days.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
        altText: 'Geometric Harmony Mandala black and white artwork',
        displayOrder: 0,
        isPrimary: true,
      },
      {
        url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
        altText: 'Geometric Harmony Mandala framed preview',
        displayOrder: 1,
        isPrimary: false,
      },
    ],
  },
  {
    sku: 'MND-PEACOCK-04',
    name: 'Peacock Feather Mandala',
    slug: 'peacock-feather-mandala',
    categorySlug: 'mandala-art',
    shortDescription: 'One-of-a-kind royal blue and teal peacock motif mandala.',
    description:
      'An opulent 18x18 inch mandala artwork inspired by the majestic peacock plumage, detailed with iridescent pigments and thousands of hand-placed acrylic dots.',
    price: 329900, // ₹3,299.00
    compareAtPrice: 399900, // ₹3,999.00
    availability: ProductAvailability.SOLD_OUT,
    stockQuantity: 0,
    dimensions: '18 × 18 inches',
    material: 'Iridescent acrylics on heavy canvas board',
    weightGrams: 1400,
    isHandmade: true,
    isFeatured: false,
    metaTitle: 'Peacock Feather Mandala (Sold Out Archive) | Mandala Art Store',
    metaDescription: 'Archival gallery display for Peacock Feather Mandala original painting.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901?auto=format&fit=crop&w=800&q=80',
        altText: 'Peacock Feather Mandala full piece',
        displayOrder: 0,
        isPrimary: true,
      },
    ],
  },

  // --- Lippan Art (3 products) ---
  {
    sku: 'LIP-TRAD-01',
    name: 'Traditional Kutch Lippan Mirror Art',
    slug: 'traditional-kutch-lippan-mirror-art',
    categorySlug: 'lippan-art',
    shortDescription: 'Authentic clay relief and mirror work from the Kutch region.',
    description:
      'Handcrafted using traditional clay relief techniques with geometric and floral mirror inlays on a reinforced MDF panel. Creates mesmerizing light reflections in any room.',
    price: 279900, // ₹2,799.00
    compareAtPrice: 349900, // ₹3,499.00
    availability: ProductAvailability.IN_STOCK,
    stockQuantity: 2,
    dimensions: '15 × 15 inches',
    material: 'Organic clay dough & glass mirrors on waterproof MDF',
    weightGrams: 1800,
    isHandmade: true,
    isFeatured: true,
    metaTitle: 'Traditional Kutch Lippan Art | Mandala Art Store',
    metaDescription:
      'Authentic handcrafted Lippan mirror artwork from Kutch Gujarat. Distinctive clay relief wall decor.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901?auto=format&fit=crop&w=800&q=80',
        altText: 'Traditional Kutch Lippan Mirror Art front view',
        displayOrder: 0,
        isPrimary: true,
      },
      {
        url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
        altText: 'Lippan mirror detail reflecting warm ambient light',
        displayOrder: 1,
        isPrimary: false,
      },
      {
        url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
        altText: 'Lippan art styled above a hallway console table',
        displayOrder: 2,
        isPrimary: false,
      },
    ],
  },
  {
    sku: 'LIP-FLORAL-02',
    name: 'Floral Lippan Medallion Panel',
    slug: 'floral-lippan-medallion-panel',
    categorySlug: 'lippan-art',
    shortDescription: 'Grand circular floral mud-and-mirror relief panel.',
    description:
      'A sophisticated statement piece combining circular floral mandala outlines with traditional Lippan mirror patterns. Finished in pristine off-white with matte sealant.',
    price: 349900, // ₹3,499.00
    compareAtPrice: 419900, // ₹4,199.00
    availability: ProductAvailability.MADE_TO_ORDER,
    stockQuantity: 4,
    dimensions: '18 × 18 inches',
    material: 'Sculptural clay and convex mirrors on wood panel',
    weightGrams: 2200,
    isHandmade: true,
    isFeatured: false,
    metaTitle: 'Floral Lippan Medallion Wall Art | Mandala Art Store',
    metaDescription:
      'Custom crafted Floral Lippan Medallion. Premium handcrafted Indian mirror relief artwork.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
        altText: 'Floral Lippan Medallion Panel',
        displayOrder: 0,
        isPrimary: true,
      },
      {
        url: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901?auto=format&fit=crop&w=800&q=80',
        altText: 'Floral Lippan side relief profile',
        displayOrder: 1,
        isPrimary: false,
      },
    ],
  },
  {
    sku: 'LIP-HEX-03',
    name: 'Geometric Hexagonal Lippan Art',
    slug: 'geometric-hexagonal-lippan-art',
    categorySlug: 'lippan-art',
    shortDescription: 'Modern geometric hexagon silhouette with classic mud art.',
    description:
      'A contemporary take on ancient Lippan craftsmanship, formatted in a clean hexagonal silhouette with diamond-shaped mirrors and terracotta wash.',
    price: 199900, // ₹1,999.00
    compareAtPrice: null,
    availability: ProductAvailability.IN_STOCK,
    stockQuantity: 4,
    dimensions: '12 × 14 inches (Hexagonal)',
    material: 'Moulding clay & craft mirrors on engineered wood',
    weightGrams: 1350,
    isHandmade: true,
    isFeatured: false,
    metaTitle: 'Hexagonal Geometric Lippan Art | Mandala Art Store',
    metaDescription:
      'Modern hexagonal Lippan art with diamond mirrors and terracotta clay detailing.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
        altText: 'Hexagonal Lippan artwork overview',
        displayOrder: 0,
        isPrimary: true,
      },
    ],
  },

  // --- Handmade Paintings (3 products) ---
  {
    sku: 'PNT-VILLAGE-01',
    name: 'Indian Heritage Village Twilight',
    slug: 'indian-heritage-village-twilight',
    categorySlug: 'handmade-paintings',
    shortDescription: 'Warm impressionist canvas of pastoral Indian village twilight.',
    description:
      'Rich acrylic and textured strokes capturing the nostalgic glow of an Indian rural evening. Golden sunsets, earthen homes, and silhouetted trees painted with deep emotional warmth.',
    price: 459900, // ₹4,599.00
    compareAtPrice: 549900, // ₹5,499.00
    availability: ProductAvailability.IN_STOCK,
    stockQuantity: 1,
    dimensions: '20 × 24 inches',
    material: 'Heavy-body acrylic on primed linen canvas',
    weightGrams: 1600,
    isHandmade: true,
    isFeatured: true,
    metaTitle: 'Indian Heritage Village Painting | Mandala Art Store',
    metaDescription:
      'Original Indian Heritage Village handmade acrylic painting on linen canvas. 1-of-1 original artwork.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
        altText: 'Indian Heritage Village Twilight complete painting',
        displayOrder: 0,
        isPrimary: true,
      },
      {
        url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
        altText: 'Painting texture and brushstroke close-up',
        displayOrder: 1,
        isPrimary: false,
      },
    ],
  },
  {
    sku: 'PNT-ABSTRACT-02',
    name: 'Earthy Horizons Textured Painting',
    slug: 'earthy-horizons-textured-painting',
    categorySlug: 'handmade-paintings',
    shortDescription: 'Modern minimalist abstract canvas in terracotta and sandstone hues.',
    description:
      'Layers of sculptured stucco paste and acrylic wash creating organic geological strata. Ideal for modern bohemian, Japandi, or minimalist Indian interiors.',
    price: 389900, // ₹3,899.00
    compareAtPrice: null,
    availability: ProductAvailability.MADE_TO_ORDER,
    stockQuantity: 3,
    dimensions: '18 × 24 inches',
    material: 'Texture paste, sand & acrylic on stretched canvas',
    weightGrams: 1900,
    isHandmade: true,
    isFeatured: false,
    metaTitle: 'Earthy Horizons Textured Painting | Mandala Art Store',
    metaDescription:
      'Minimalist earthy textured painting with organic terracotta tones. Made to order on canvas.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901?auto=format&fit=crop&w=800&q=80',
        altText: 'Earthy Horizons Textured Painting front view',
        displayOrder: 0,
        isPrimary: true,
      },
      {
        url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
        altText: 'Close up of sculptural sand texture',
        displayOrder: 1,
        isPrimary: false,
      },
    ],
  },
  {
    sku: 'PNT-TREE-03',
    name: 'Tree of Life Folk Painting',
    slug: 'tree-of-life-folk-painting',
    categorySlug: 'handmade-paintings',
    shortDescription: 'Vibrant Gond-inspired contemporary Tree of Life on canvas.',
    description:
      'Celebration of natural vitality featuring a dynamic Tree of Life with playful birds and intricate patterned leaves in radiant earth tones and emerald green.',
    price: 289900, // ₹2,899.00
    compareAtPrice: 329900, // ₹3,299.00
    availability: ProductAvailability.IN_STOCK,
    stockQuantity: 2,
    dimensions: '16 × 20 inches',
    material: 'Acrylic and archival ink on stretched canvas board',
    weightGrams: 1100,
    isHandmade: true,
    isFeatured: false,
    metaTitle: 'Tree of Life Folk Art Painting | Mandala Art Store',
    metaDescription:
      'Original Tree of Life folk artwork painting. Hand-painted on canvas with fine detailing.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
        altText: 'Tree of Life Folk Painting overview',
        displayOrder: 0,
        isPrimary: true,
      },
    ],
  },
];

/**
 * Idempotent Seed Function
 * Upserts categories and products using unique slugs and SKUs,
 * and maintains deterministic image sets.
 */
export async function seedCatalog(prisma: PrismaClient): Promise<{
  categoriesCount: number;
  productsCount: number;
}> {
  console.log('🌱 Starting controlled catalog seeding...');

  // 1. Seed Categories (Upsert by slug)
  const categoryMap = new Map<string, string>(); // slug -> categoryId

  for (const cat of SEED_CATEGORIES) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        imageUrl: cat.imageUrl,
        displayOrder: cat.displayOrder,
        isActive: true,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        imageUrl: cat.imageUrl,
        displayOrder: cat.displayOrder,
        isActive: true,
      },
    });

    categoryMap.set(cat.slug, category.id);
  }

  console.log(`✅ Seeded ${categoryMap.size} categories.`);

  // 2. Seed Products (Upsert by SKU)
  let productsCount = 0;

  for (const item of SEED_PRODUCTS) {
    const categoryId = categoryMap.get(item.categorySlug);
    if (!categoryId) {
      throw new Error(`Category not found for slug: ${item.categorySlug}`);
    }

    const product = await prisma.product.upsert({
      where: { sku: item.sku },
      update: {
        name: item.name,
        slug: item.slug,
        categoryId,
        shortDescription: item.shortDescription,
        description: item.description,
        price: item.price,
        compareAtPrice: item.compareAtPrice,
        availability: item.availability,
        stockQuantity: item.stockQuantity,
        dimensions: item.dimensions,
        material: item.material,
        weightGrams: item.weightGrams,
        isHandmade: item.isHandmade,
        isFeatured: item.isFeatured,
        isActive: true,
        metaTitle: item.metaTitle,
        metaDescription: item.metaDescription,
      },
      create: {
        sku: item.sku,
        name: item.name,
        slug: item.slug,
        categoryId,
        shortDescription: item.shortDescription,
        description: item.description,
        price: item.price,
        compareAtPrice: item.compareAtPrice,
        availability: item.availability,
        stockQuantity: item.stockQuantity,
        dimensions: item.dimensions,
        material: item.material,
        weightGrams: item.weightGrams,
        isHandmade: item.isHandmade,
        isFeatured: item.isFeatured,
        isActive: true,
        metaTitle: item.metaTitle,
        metaDescription: item.metaDescription,
      },
    });

    // 3. Idempotently Sync Product Images (Delete existing seed images and recreate)
    await prisma.productImage.deleteMany({
      where: { productId: product.id },
    });

    if (item.images.length > 0) {
      await prisma.productImage.createMany({
        data: item.images.map(img => ({
          productId: product.id,
          url: img.url,
          altText: img.altText,
          displayOrder: img.displayOrder,
          isPrimary: img.isPrimary,
        })),
      });
    }

    productsCount++;
  }

  console.log(`✅ Seeded ${productsCount} products with deterministic image galleries.`);
  return { categoriesCount: categoryMap.size, productsCount };
}

// CLI Execution Handler
if (require.main === module) {
  const prisma = new PrismaClient();
  seedCatalog(prisma)
    .then(async () => {
      await prisma.$disconnect();
      console.log('✨ Catalog seed completed successfully.');
      process.exit(0);
    })
    .catch(async e => {
      console.error('❌ Error executing catalog seed:', e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
