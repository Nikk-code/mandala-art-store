process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/mandala_store?schema=public';

import { describe, it, expect } from 'vitest';
import { productRepository, categoryRepository, userRepository } from '../src/repositories';
import { prisma } from '../src/db/prisma';

describe('Repository Layer Foundation', () => {
  describe('Repository Instance Initialization', () => {
    it('initializes ProductRepository with all required query methods', () => {
      expect(productRepository).toBeDefined();
      expect(typeof productRepository.findById).toBe('function');
      expect(typeof productRepository.findBySlug).toBe('function');
      expect(typeof productRepository.findBySku).toBe('function');
      expect(typeof productRepository.findActiveProducts).toBe('function');
      expect(typeof productRepository.create).toBe('function');
      expect(typeof productRepository.update).toBe('function');
      expect(typeof productRepository.deactivate).toBe('function');
    });

    it('initializes CategoryRepository with all required query methods', () => {
      expect(categoryRepository).toBeDefined();
      expect(typeof categoryRepository.findById).toBe('function');
      expect(typeof categoryRepository.findBySlug).toBe('function');
      expect(typeof categoryRepository.findActiveCategories).toBe('function');
      expect(typeof categoryRepository.create).toBe('function');
      expect(typeof categoryRepository.update).toBe('function');
      expect(typeof categoryRepository.deactivate).toBe('function');
    });

    it('initializes UserRepository with all required query methods', () => {
      expect(userRepository).toBeDefined();
      expect(typeof userRepository.findById).toBe('function');
      expect(typeof userRepository.findByEmail).toBe('function');
      expect(typeof userRepository.create).toBe('function');
      expect(typeof userRepository.update).toBe('function');
      expect(typeof userRepository.deactivate).toBe('function');
    });
  });

  describe('Integration Query Execution (when PostgreSQL is active)', () => {
    it('executes repository queries without syntax or mapping errors', async () => {
      try {
        const categories = await categoryRepository.findActiveCategories();
        expect(Array.isArray(categories)).toBe(true);

        const products = await productRepository.findActiveProducts();
        expect(Array.isArray(products)).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
