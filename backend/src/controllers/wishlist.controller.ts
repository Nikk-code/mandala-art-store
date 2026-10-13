import type { Request, Response, NextFunction } from 'express';
import { wishlistService } from '../services/wishlist.service';

export async function getWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const items = await wishlistService.getUserWishlist(userId);
    res.status(200).json({
      success: true,
      data: {
        items,
        count: items.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function addToWishlist(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const item = await wishlistService.addToWishlist(userId, req.body);
    res.status(201).json({
      success: true,
      data: { item },
    });
  } catch (error) {
    next(error);
  }
}

export async function removeFromWishlist(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const result = await wishlistService.removeFromWishlist(userId, req.params.productId);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function checkWishlist(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const inWishlist = await wishlistService.isInWishlist(userId, req.params.productId);
    res.status(200).json({
      success: true,
      data: {
        productId: req.params.productId,
        inWishlist,
      },
    });
  } catch (error) {
    next(error);
  }
}
