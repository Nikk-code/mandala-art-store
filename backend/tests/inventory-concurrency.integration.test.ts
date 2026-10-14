import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient, ProductAvailability } from '@prisma/client';
import { ProductRepository } from '../src/repositories/product.repository';
import { OrderService } from '../src/services/order.service';
import { OrderRepository } from '../src/repositories/order.repository';
import { ConflictError } from '../src/errors';
import crypto from 'crypto';

/**
 * Genuine PostgreSQL Concurrency Integration Test Suite
 *
 * Requirements:
 * - A live PostgreSQL 16 database reachable via TEST_DATABASE_URL or DATABASE_URL.
 * - This suite connects via separate, independent PrismaClient instances to execute
 *   true concurrent transactions across separate PostgreSQL socket connections.
 * - If PostgreSQL is not reachable, the suite logs environment requirements and skips
 *   execution, preventing false claims of live concurrency verification.
 *
 * Database Targeting & Fail-Fast Safety Guard:
 * - Dedicated test database default: mandala_test.
 * - Never runs against or cleans an arbitrary, development, or production database.
 * - If a database URL does not explicitly include "test" in its database name and
 *   ALLOW_TEST_DB_OPERATIONS=true is not set, the suite fails fast immediately.
 */

function isExplicitTestDatabase(urlStr: string): boolean {
  if (process.env.ALLOW_TEST_DB_OPERATIONS === 'true') {
    return true;
  }
  try {
    const parsed = new URL(urlStr);
    const dbPath = parsed.pathname.toLowerCase();
    return dbPath.includes('test');
  } catch {
    return urlStr.toLowerCase().includes('test');
  }
}

function resolveAndValidateTestDatabaseUrl(): string {
  // 1. If TEST_DATABASE_URL is explicitly provided, validate it strictly
  if (process.env.TEST_DATABASE_URL) {
    const url = process.env.TEST_DATABASE_URL;
    if (!isExplicitTestDatabase(url)) {
      throw new Error(
        `[FAIL-FAST SAFETY GUARD] Integration test suite refused to run against TEST_DATABASE_URL: "${url}". ` +
          `Database name must explicitly contain "test" (e.g. /mandala_test) or ALLOW_TEST_DB_OPERATIONS=true must be set. ` +
          `Arbitrary or production databases will never be touched.`
      );
    }
    return url;
  }

  // 2. If DATABASE_URL is provided, check if it points to a test database
  if (process.env.DATABASE_URL && isExplicitTestDatabase(process.env.DATABASE_URL)) {
    return process.env.DATABASE_URL;
  }

  // 3. Default to dedicated local test database
  return 'postgresql://postgres:postgres@localhost:5432/mandala_test?schema=public';
}

const testDbUrl = resolveAndValidateTestDatabaseUrl();

// Ensure process.env.DATABASE_URL matches testDbUrl so any fallback singleton binds to test database
process.env.DATABASE_URL = testDbUrl;

// Pre-flight connection probe
let isPostgresAvailable = false;
try {
  const probeClient = new PrismaClient({
    datasources: { db: { url: testDbUrl } },
    log: ['error'],
  });
  // Quick 1.5s probe
  const probePromise = probeClient.$queryRaw`SELECT 1 as live`;
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Connection probe timeout')), 1500)
  );
  await Promise.race([probePromise, timeoutPromise]);
  isPostgresAvailable = true;
  await probeClient.$disconnect();
} catch {
  isPostgresAvailable = false;
}

describe.skipIf(!isPostgresAvailable)(
  'Real PostgreSQL Concurrency & Isolation Integration Tests',
  () => {
    // Separate PrismaClient instances simulate concurrent clients / connections
    let clientA: PrismaClient;
    let clientB: PrismaClient;
    let repoA: ProductRepository;
    let repoB: ProductRepository;
    let orderRepoA: OrderRepository;
    let orderRepoB: OrderRepository;
    let orderServiceA: OrderService;
    let orderServiceB: OrderService;

    // Unique run identifier ensures complete test isolation across repeated runs
    const testRunId = crypto.randomUUID().substring(0, 8);
    const testCategoryId = `cat-conc-${testRunId}-${Date.now()}`;
    const testEmailDomain = `mandala-conc-${testRunId}.internal`;
    const makeTestEmail = (scenario: string) => `buyer-${scenario}-${testRunId}@${testEmailDomain}`;

    const createdProductIds: string[] = [];
    const createdOrderIds: string[] = [];

    beforeAll(async () => {
      clientA = new PrismaClient({
        datasources: { db: { url: testDbUrl } },
      });
      clientB = new PrismaClient({
        datasources: { db: { url: testDbUrl } },
      });

      await clientA.$connect();
      await clientB.$connect();

      // Multi-connection repository & service wiring
      repoA = new ProductRepository(clientA);
      repoB = new ProductRepository(clientB);
      orderRepoA = new OrderRepository(clientA);
      orderRepoB = new OrderRepository(clientB);
      orderServiceA = new OrderService(orderRepoA, clientA);
      orderServiceB = new OrderService(orderRepoB, clientB);

      // Create isolated test Category
      await clientA.category.create({
        data: {
          id: testCategoryId,
          name: `Concurrency Test Category ${testRunId}`,
          slug: `concurrency-test-cat-${testRunId}`,
          displayOrder: 1,
          isActive: true,
        },
      });
    });

    afterAll(async () => {
      if (isPostgresAvailable) {
        try {
          // Strictly follow foreign-key dependency order for deletion:
          // 1. Delete Payments first (Order has onDelete: Restrict on payments)
          if (createdOrderIds.length > 0) {
            await clientA.payment.deleteMany({
              where: { orderId: { in: createdOrderIds } },
            });
          }
          await clientA.payment.deleteMany({
            where: {
              order: {
                customerEmail: { contains: `@${testEmailDomain}` },
              },
            },
          });

          // 2. Delete OrderItems (Order has onDelete: Cascade, but explicit cleanup is defensive)
          if (createdOrderIds.length > 0) {
            await clientA.orderItem.deleteMany({
              where: { orderId: { in: createdOrderIds } },
            });
          }
          if (createdProductIds.length > 0) {
            await clientA.orderItem.deleteMany({
              where: { productId: { in: createdProductIds } },
            });
          }

          // 3. Delete Orders (now unblocked since Payments and OrderItems are cleared)
          if (createdOrderIds.length > 0) {
            await clientA.order.deleteMany({
              where: { id: { in: createdOrderIds } },
            });
          }
          await clientA.order.deleteMany({
            where: {
              customerEmail: { contains: `@${testEmailDomain}` },
            },
          });

          // 4. Delete ProductImages (defensive cleanup before products)
          if (createdProductIds.length > 0) {
            await clientA.productImage.deleteMany({
              where: { productId: { in: createdProductIds } },
            });
          }

          // 5. Delete Products
          if (createdProductIds.length > 0) {
            await clientA.product.deleteMany({
              where: { id: { in: createdProductIds } },
            });
          }

          // 6. Delete Category (now unblocked since Products are cleared)
          await clientA.category.deleteMany({
            where: { id: testCategoryId },
          });
        } catch (cleanupErr) {
          console.warn('[CLEANUP WARNING] Non-fatal integration test cleanup warning:', cleanupErr);
        } finally {
          // Guaranteed disconnection of both client connections even if queries error
          await clientA?.$disconnect();
          await clientB?.$disconnect();
        }
      }
    });

    const createTestProduct = async (overrides: {
      stockQuantity: number;
      availability?: ProductAvailability;
    }) => {
      const id = crypto.randomUUID();
      createdProductIds.push(id);
      return clientA.product.create({
        data: {
          id,
          sku: `SKU-CONC-${testRunId}-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          name: `Concurrency Artwork ${id.substring(0, 8)}`,
          slug: `concurrency-art-${id}`,
          description: 'Authentic canvas artwork for concurrency verification',
          price: 150000,
          categoryId: testCategoryId,
          stockQuantity: overrides.stockQuantity,
          availability: overrides.availability ?? ProductAvailability.IN_STOCK,
          isActive: true,
        },
      });
    };

    it('Scenario 1: Two decrements competing for insufficient remaining stock (Zero Negative Stock)', async () => {
      // Product has 5 units.
      const product = await createTestProduct({ stockQuantity: 5 });

      // Client A and Client B concurrently attempt to decrement 3 units each (total 6 > 5)
      const results = await Promise.allSettled([
        repoA.adjustStock(product.id, { adjustment: -3 }),
        repoB.adjustStock(product.id, { adjustment: -3 }),
      ]);

      const fulfilled = results.filter(r => r.status === 'fulfilled');
      const rejected = results.filter(r => r.status === 'rejected');

      // Exactly one must succeed, and one must be rejected with ConflictError (409)
      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);

      const rejectedError = (rejected[0] as PromiseRejectedResult).reason;
      expect(rejectedError).toBeInstanceOf(ConflictError);

      // Verify authoritative database state: remaining stock is 2, never negative
      const persisted = await clientA.product.findUniqueOrThrow({ where: { id: product.id } });
      expect(persisted.stockQuantity).toBe(2);
      expect(persisted.availability).toBe(ProductAvailability.IN_STOCK);
    });

    it('Scenario 2: Admin increment racing with checkout decrement (No Lost Updates)', async () => {
      // Product has 5 units.
      const product = await createTestProduct({ stockQuantity: 5 });

      // Concurrently on separate database connections:
      // Checkout reserves 2 units (-2) via Connection B
      // Admin receives a new art shipment of 4 units (+4) via Connection A
      const checkoutPromise = orderServiceB.createOrder(
        {
          customer: {
            fullName: 'Live Concurrency Customer',
            email: makeTestEmail('sc2'),
            phone: '9876543210',
          },
          shippingAddress: {
            addressLine1: 'MG Road Art Gallery',
            city: 'Bengaluru',
            state: 'Karnataka',
            postalCode: '560001',
          },
          items: [{ productId: product.id, quantity: 2 }],
        },
        null
      );
      const adminIncrementPromise = repoA.adjustStock(product.id, { adjustment: 4 });

      const [checkoutOrder, adminProduct] = await Promise.all([
        checkoutPromise,
        adminIncrementPromise,
      ]);

      createdOrderIds.push(checkoutOrder.id);

      expect(checkoutOrder.status).toBe('PENDING_PAYMENT');
      expect(adminProduct.id).toBe(product.id);

      // Final persisted stock must reflect both operations: 5 - 2 + 4 = 7
      const persisted = await clientA.product.findUniqueOrThrow({ where: { id: product.id } });
      expect(persisted.stockQuantity).toBe(7);
      expect(persisted.availability).toBe(ProductAvailability.IN_STOCK);
    });

    it('Scenario 3A: Stale UI count update after intervening checkout (Stale UI Count Protection)', async () => {
      // Product has 10 units. Admin UI loaded 10 (expectedStock = 10).
      const product = await createTestProduct({ stockQuantity: 10 });

      // Intervening customer checkout: 3 units purchased
      const order3A = await orderServiceB.createOrder(
        {
          customer: {
            fullName: 'Interleaving Customer',
            email: makeTestEmail('sc3a'),
            phone: '9876543210',
          },
          shippingAddress: {
            addressLine1: 'Koramangala 4th Block',
            city: 'Bengaluru',
            state: 'Karnataka',
            postalCode: '560034',
          },
          items: [{ productId: product.id, quantity: 3 }],
        },
        null
      );
      createdOrderIds.push(order3A.id);

      // Admin submits stale count of 10 with expectedStock = 10 (without force)
      await expect(
        repoA.adjustStock(product.id, {
          stockQuantity: 10,
          expectedStock: 10,
          force: false,
        })
      ).rejects.toThrow(ConflictError);

      // Database stock remains 7 (checkout reservation was NOT overwritten)
      const persisted = await clientA.product.findUniqueOrThrow({ where: { id: product.id } });
      expect(persisted.stockQuantity).toBe(7);
    });

    it('Scenario 3B: Simultaneous race between exact-set and checkout (Preserved Reservations)', async () => {
      // Product has 10 units. Both operations dispatched simultaneously across separate connections.
      const product = await createTestProduct({ stockQuantity: 10 });

      const results = await Promise.allSettled([
        orderServiceB.createOrder(
          {
            customer: {
              fullName: 'Simultaneous Customer',
              email: makeTestEmail('sc3b'),
              phone: '9876543210',
            },
            shippingAddress: {
              addressLine1: 'Richmond Road',
              city: 'Bengaluru',
              state: 'Karnataka',
              postalCode: '560025',
            },
            items: [{ productId: product.id, quantity: 3 }],
          },
          null
        ),
        repoA.adjustStock(product.id, {
          stockQuantity: 12,
          expectedStock: 10,
          force: false,
        }),
      ]);

      const checkoutRes = results[0];
      const adminRes = results[1];

      // Checkout must ALWAYS succeed since initial stock was 10 >= 3
      expect(checkoutRes.status).toBe('fulfilled');
      if (checkoutRes.status === 'fulfilled') {
        createdOrderIds.push(checkoutRes.value.id);
      }

      const persisted = await clientA.product.findUniqueOrThrow({ where: { id: product.id } });

      if (adminRes.status === 'rejected') {
        // Checkout committed first; admin update received 409 ConflictError
        expect((adminRes as PromiseRejectedResult).reason).toBeInstanceOf(ConflictError);
        expect(persisted.stockQuantity).toBe(7); // 10 - 3 = 7
      } else {
        // Admin update committed first (stock set to 12), then checkout decremented 3
        expect(persisted.stockQuantity).toBe(9); // 12 - 3 = 9
      }
      expect(persisted.availability).toBe(ProductAvailability.IN_STOCK);
    });

    it('Scenario 4: Two exact-quantity updates using the same expectedStock (Mutual Exclusion)', async () => {
      // Initial stock: 10
      const product = await createTestProduct({ stockQuantity: 10 });

      // Admin 1 sets 12; Admin 2 sets 15. Both saw expectedStock = 10.
      const results = await Promise.allSettled([
        repoA.adjustStock(product.id, { stockQuantity: 12, expectedStock: 10, force: false }),
        repoB.adjustStock(product.id, { stockQuantity: 15, expectedStock: 10, force: false }),
      ]);

      const fulfilled = results.filter(r => r.status === 'fulfilled');
      const rejected = results.filter(r => r.status === 'rejected');

      // Exactly one must succeed and one must be rejected with ConflictError
      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(ConflictError);

      // Persisted stock must be either 12 or 15
      const persisted = await clientA.product.findUniqueOrThrow({ where: { id: product.id } });
      expect([12, 15]).toContain(persisted.stockQuantity);
    });

    it('Scenario 5: Concurrent operations that deplete and replenish stock (Consistent Availability Transitions)', async () => {
      // Initial stock: 1, IN_STOCK
      const product = await createTestProduct({ stockQuantity: 1 });

      // Concurrently across separate connections:
      // Decrement 1 (depletes to 0 -> SOLD_OUT)
      // Increment 3 (replenishes -> IN_STOCK)
      await Promise.all([
        repoA.adjustStock(product.id, { adjustment: -1 }),
        repoB.adjustStock(product.id, { adjustment: 3 }),
      ]);

      // Final persisted stock: 1 - 1 + 3 = 3
      // Final availability MUST be IN_STOCK (never stuck on stale SOLD_OUT)
      const persisted = await clientA.product.findUniqueOrThrow({ where: { id: product.id } });
      expect(persisted.stockQuantity).toBe(3);
      expect(persisted.availability).toBe(ProductAvailability.IN_STOCK);
    });

    it('Scenario 6: Forced physical recount racing with checkout (Documented Override Semantics)', async () => {
      // Initial stock: 10
      const product = await createTestProduct({ stockQuantity: 10 });

      // Concurrently:
      // Customer orders 2 units via Connection B
      // Admin performs authoritative physical recount asserting shelf stock = 20 (force: true) via Connection A
      const [checkoutOrder] = await Promise.all([
        orderServiceB.createOrder(
          {
            customer: {
              fullName: 'Recount Overlap Customer',
              email: makeTestEmail('sc6'),
              phone: '9876543210',
            },
            shippingAddress: {
              addressLine1: 'Indiranagar 100ft Road',
              city: 'Bengaluru',
              state: 'Karnataka',
              postalCode: '560038',
            },
            items: [{ productId: product.id, quantity: 2 }],
          },
          null
        ),
        repoA.adjustStock(product.id, {
          stockQuantity: 20,
          expectedStock: 10,
          force: true, // Explicit physical recount override
        }),
      ]);

      createdOrderIds.push(checkoutOrder.id);

      // Both operations succeed without throwing unexpected 409
      const persisted = await clientA.product.findUniqueOrThrow({ where: { id: product.id } });
      // Stock is either 20 (if recount ran last) or 18 (if checkout ran after recount)
      expect([18, 20]).toContain(persisted.stockQuantity);
      expect(persisted.availability).toBe(ProductAvailability.IN_STOCK);
    });

    it('Scenario 7: MADE_TO_ORDER preservation across concurrent operations', async () => {
      // Product is MADE_TO_ORDER with stock 0
      const product = await createTestProduct({
        stockQuantity: 0,
        availability: ProductAvailability.MADE_TO_ORDER,
      });

      // Admin adjustments running concurrently across separate connections
      await Promise.all([
        repoA.adjustStock(product.id, { adjustment: 5 }),
        repoB.adjustStock(product.id, { stockQuantity: 0, force: true }),
      ]);

      const persisted = await clientA.product.findUniqueOrThrow({ where: { id: product.id } });
      // Availability MUST strictly remain MADE_TO_ORDER, never altered to IN_STOCK or SOLD_OUT
      expect(persisted.availability).toBe(ProductAvailability.MADE_TO_ORDER);
    });
  }
);

// If PostgreSQL was not available on probe, describe a test noting the requirement
describe.skipIf(isPostgresAvailable)(
  'Real PostgreSQL Concurrency & Isolation Integration Tests (Environment Notice)',
  () => {
    it('requires live PostgreSQL 16 on localhost:5432 to execute live socket concurrency suite', () => {
      console.warn(
        '[INTEGRATION SUITE NOTICE] Live PostgreSQL server not detected on localhost:5432. ' +
          'To execute this live concurrency test suite: ' +
          '1. Ensure Docker is running and run `docker compose up -d` (or start PostgreSQL 16 on port 5432). ' +
          '2. Run `npm test -- inventory-concurrency.integration.test.ts` in backend.'
      );
      expect(isPostgresAvailable).toBe(false);
    });
  }
);
