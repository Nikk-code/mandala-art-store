import type { Request, Response, NextFunction } from 'express';
import { addressService } from '../services/address.service';

export async function getAddresses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const addresses = await addressService.getUserAddresses(userId);
    res.status(200).json({
      success: true,
      data: { addresses },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAddressById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const address = await addressService.getAddressById(req.params.id, userId);
    res.status(200).json({
      success: true,
      data: { address },
    });
  } catch (error) {
    next(error);
  }
}

export async function createAddress(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const address = await addressService.createAddress(userId, req.body);
    res.status(201).json({
      success: true,
      data: { address },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAddress(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const address = await addressService.updateAddress(req.params.id, userId, req.body);
    res.status(200).json({
      success: true,
      data: { address },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteAddress(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    await addressService.deleteAddress(req.params.id, userId);
    res.status(200).json({
      success: true,
      data: { message: 'Address deleted successfully.' },
    });
  } catch (error) {
    next(error);
  }
}

export async function setDefaultAddress(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const address = await addressService.setDefaultAddress(req.params.id, userId);
    res.status(200).json({
      success: true,
      data: { address },
    });
  } catch (error) {
    next(error);
  }
}
