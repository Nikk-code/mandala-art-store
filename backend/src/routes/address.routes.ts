import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  getAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../controllers/address.controller';

const router = Router();

// All address management endpoints strictly require verified authentication
router.use(requireAuth);

router.get('/', getAddresses);
router.post('/', createAddress);
router.get('/:id', getAddressById);
router.patch('/:id', updateAddress);
router.delete('/:id', deleteAddress);
router.post('/:id/default', setDefaultAddress);
router.patch('/:id/default', setDefaultAddress);

export default router;
