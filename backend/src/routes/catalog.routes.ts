import { Router } from 'express';
import { getCategories, getProducts, getProductBySlug } from '../controllers/catalog.controller';

const router = Router();

// GET /api/categories
router.get('/categories', getCategories);

// GET /api/products
router.get('/products', getProducts);

// GET /api/products/:slug
router.get('/products/:slug', getProductBySlug);

export default router;
