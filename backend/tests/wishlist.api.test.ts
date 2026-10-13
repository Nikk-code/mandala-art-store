import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app';
import { wishlistRepository } from '../src/repositories/wishlist.repository';
import { productRepository } from '../src/repositories/product.repository';
import { userRepository } from '../src/repositories/user.repository';
import { config } from '../src/config/env';
import { UserRole, ProductAvailability } from '@prisma/client';
import type { WishlistItemWithProduct } from '../src/repositories/wishlist.repository';
import type { ProductWithDetails } from '../src/repositories/product.repository';

describe('Wishlist REST API Endpoints (/api/wishlist)', () => {
  const customerAId = '11111111-1111-4111-8111-111111111111';
  const customerBId = '22222222-2222-4222-8222-222222222222';
  const productAId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const productBId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const wishlistAId = 'wwwwwwww-wwww-4www-8www-wwwwwwwwwwww';

  const customerA = {
    id: customerAId,
    email: 'ananya@example.com',
    passwordHash: 'hashed',
    firstName: 'Ananya',
    lastName: 'Sharma',
    phone: '9876543210',
    role: UserRole.CUSTOMER,
    isActive: true,
    createdAt: new Date('2026-10-05T12:00:00.000Z'),
    updatedAt: new Date('2026-10-05T12:00:00.000Z'),
  };

  const productA: ProductWithDetails = {
    id: productAId,
    sku: 'MAN-001',
    name: 'Cosmic Mandala Canvas',
    slug: 'cosmic-mandala-canvas',
    description: 'Detailed cosmic mandala painting.',
    shortDescription: 'Cosmic mandala art piece.',
    price: 149900,
    compareAtPrice: 199900,
    categoryId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    availability: ProductAvailability.IN_STOCK,
    stockQuantity: 10,
    dimensions: '30x30 cm',
    material: 'Canvas & Acrylic',
    weightGrams: 500,
    isHandmade: true,
    isFeatured: true,
    isActive: true,
    metaTitle: 'Cosmic Mandala Canvas',
    metaDescription: 'Handmade canvas mandala',
    createdAt: new Date('2026-10-01T10:00:00.000Z'),
    updatedAt: new Date('2026-10-01T10:00:00.000Z'),
    category: {
      id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      name: 'Canvas Art',
      slug: 'canvas-art',
      description: 'Canvas category',
      imageUrl: null,
      displayOrder: 1,
      isActive: true,
      createdAt: new Date('2026-10-01T10:00:00.000Z'),
      updatedAt: new Date('2026-10-01T10:00:00.000Z'),
    },
    images: [
      {
        id: 'img-1',
        productId: productAId,
        url: 'https://images.example.com/cosmic.jpg',
        altText: 'Cosmic Mandala',
        displayOrder: 0,
        isPrimary: true,
      },
    ],
  };

  const wishlistItemA: WishlistItemWithProduct = {
    id: wishlistAId,
    userId: customerAId,
    productId: productAId,
    createdAt: new Date('2026-10-10T12:00:00.000Z'),
    product: productA,
  };

  function createAuthToken(
    userId: string = customerAId,
    email: string = 'ananya@example.com'
  ): string {
    return jwt.sign({ id: userId, email, role: 'CUSTOMER' }, config.jwtSecret, {
      expiresIn: '7d',
      algorithm: 'HS256',
    });
  }

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(userRepository, 'findById').mockImplementation(async (id: string) => {
      if (id === customerAId) return customerA;
      return null;
    });
  });

  describe('Authentication and Authorization Guards', () => {
    it('returns 401 when no credentials are provided', async () => {
      const response = await request(app).get('/api/wishlist');
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('returns 401 when token is invalid or expired', async () => {
      const response = await request(app)
        .get('/api/wishlist')
        .set('Authorization', 'Bearer invalid-token');
      expect(response.status).toBe(401);
    });

    it('returns 401 when customer account is deactivated', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue({
        ...customerA,
        isActive: false,
      });

      const token = createAuthToken();
      const response = await request(app)
        .get('/api/wishlist')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body.error.message).toContain('deactivated');
    });
  });

  describe('GET /api/wishlist', () => {
    it('returns 200 with customer wishlist items', async () => {
      vi.spyOn(wishlistRepository, 'findByUserId').mockResolvedValue([wishlistItemA]);

      const token = createAuthToken();
      const response = await request(app)
        .get('/api/wishlist')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.count).toBe(1);
      expect(response.body.data.items[0].product.name).toBe('Cosmic Mandala Canvas');
      expect(wishlistRepository.findByUserId).toHaveBeenCalledWith(customerAId);
    });
  });

  describe('POST /api/wishlist', () => {
    it('returns 201 and adds product to wishlist', async () => {
      vi.spyOn(productRepository, 'findById').mockResolvedValue(productA);
      vi.spyOn(wishlistRepository, 'findByUserAndProduct').mockResolvedValue(null);
      vi.spyOn(wishlistRepository, 'add').mockResolvedValue(wishlistItemA);

      const token = createAuthToken();
      const response = await request(app)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: productAId });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.item.productId).toBe(productAId);
      expect(wishlistRepository.add).toHaveBeenCalledWith(customerAId, productAId);
    });

    it('ignores client-supplied userId spoofing and derives identity strictly from auth', async () => {
      vi.spyOn(productRepository, 'findById').mockResolvedValue(productA);
      vi.spyOn(wishlistRepository, 'findByUserAndProduct').mockResolvedValue(null);
      vi.spyOn(wishlistRepository, 'add').mockResolvedValue(wishlistItemA);

      const token = createAuthToken();
      const response = await request(app)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: productAId, userId: customerBId }); // Attempted spoof

      expect(response.status).toBe(201);
      expect(wishlistRepository.add).toHaveBeenCalledWith(customerAId, productAId);
    });

    it('returns 400 when productId is invalid UUID format', async () => {
      const token = createAuthToken();
      const response = await request(app)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: 'invalid-id' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 404 when product does not exist', async () => {
      vi.spyOn(productRepository, 'findById').mockResolvedValue(null);

      const token = createAuthToken();
      const response = await request(app)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: productBId });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('returns 404 when product is inactive', async () => {
      vi.spyOn(productRepository, 'findById').mockResolvedValue({
        ...productA,
        isActive: false,
      });

      const token = createAuthToken();
      const response = await request(app)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: productAId });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('returns 409 when product is already in user wishlist', async () => {
      vi.spyOn(productRepository, 'findById').mockResolvedValue(productA);
      vi.spyOn(wishlistRepository, 'findByUserAndProduct').mockResolvedValue({
        id: wishlistAId,
        userId: customerAId,
        productId: productAId,
        createdAt: new Date(),
      });

      const token = createAuthToken();
      const response = await request(app)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: productAId });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('CONFLICT');
    });
  });

  describe('DELETE /api/wishlist/:productId', () => {
    it('returns 200 and removes product from user wishlist', async () => {
      vi.spyOn(wishlistRepository, 'findByUserAndProduct').mockResolvedValue({
        id: wishlistAId,
        userId: customerAId,
        productId: productAId,
        createdAt: new Date(),
      });
      vi.spyOn(wishlistRepository, 'remove').mockResolvedValue({
        id: wishlistAId,
        userId: customerAId,
        productId: productAId,
        createdAt: new Date(),
      });

      const token = createAuthToken();
      const response = await request(app)
        .delete(`/api/wishlist/${productAId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Product removed from wishlist.');
      expect(wishlistRepository.remove).toHaveBeenCalledWith(customerAId, productAId);
    });

    it('returns 400 for invalid productId UUID format', async () => {
      const token = createAuthToken();
      const response = await request(app)
        .delete('/api/wishlist/not-a-uuid')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 404 when removing an item not in user wishlist (anti-IDOR)', async () => {
      vi.spyOn(wishlistRepository, 'findByUserAndProduct').mockResolvedValue(null);

      const token = createAuthToken();
      const response = await request(app)
        .delete(`/api/wishlist/${productBId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/wishlist/check/:productId', () => {
    it('returns 200 with inWishlist: true when product is in wishlist', async () => {
      vi.spyOn(wishlistRepository, 'findByUserAndProduct').mockResolvedValue({
        id: wishlistAId,
        userId: customerAId,
        productId: productAId,
        createdAt: new Date(),
      });

      const token = createAuthToken();
      const response = await request(app)
        .get(`/api/wishlist/check/${productAId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.inWishlist).toBe(true);
      expect(response.body.data.productId).toBe(productAId);
    });

    it('returns 200 with inWishlist: false when product is absent', async () => {
      vi.spyOn(wishlistRepository, 'findByUserAndProduct').mockResolvedValue(null);

      const token = createAuthToken();
      const response = await request(app)
        .get(`/api/wishlist/check/${productBId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.inWishlist).toBe(false);
    });
  });
});
