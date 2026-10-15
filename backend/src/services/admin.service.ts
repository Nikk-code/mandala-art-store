import { UserRole } from '@prisma/client';
import { userRepository, type UserRepository } from '../repositories/user.repository';
import { UnauthorizedError, ForbiddenError, NotFoundError, BadRequestError } from '../errors';
import { validateEmail } from '../utils/auth-validation';
import { config } from '../config/env';
import type { AdminDashboardResponseData, PromoteAdminResult } from '../types/admin';

export class AdminService {
  constructor(private userRepo: UserRepository = userRepository) {}

  /**
   * Retrieves dashboard metadata and authenticated admin identity.
   * Strictly enforces that the caller exists, is active, and possesses the ADMIN role.
   */
  public async getDashboardData(userId: string): Promise<AdminDashboardResponseData> {
    const user = await this.userRepo.findById(userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedError('User account not found or deactivated.');
    }

    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenError('Administrator access required.');
    }

    return {
      admin: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: 'ADMIN',
      },
      system: {
        environment: config.nodeEnv,
        serverTime: new Date().toISOString(),
        version: '0.1.0',
      },
      modules: [
        {
          id: 'catalog',
          name: 'Art Catalog Management',
          description:
            'Create, edit, and organize sacred mandala artworks, Lippan art categories, pricing, and visual galleries.',
          status: 'AVAILABLE',
          path: '/admin/products',
        },
        {
          id: 'orders',
          name: 'Order Fulfillment & Logistics',
          description:
            'Inspect customer orders, track payments, update shipping statuses, and enter courier tracking details.',
          status: 'AVAILABLE',
          path: '/admin/orders',
        },
        {
          id: 'customers',
          name: 'Customer Accounts & Patronage',
          description:
            'Review registered art patrons, order histories, saved delivery addresses, and account statuses.',
          status: 'PLANNED',
          path: '/admin/customers',
        },
        {
          id: 'reviews',
          name: 'Reviews & Feedback Moderation',
          description:
            'Moderate artwork testimonials, inspect star ratings, and ensure verified buyer review authenticity.',
          status: 'PLANNED',
          path: '/admin/reviews',
        },
        {
          id: 'inventory',
          name: 'Inventory & Stock Allocation',
          description:
            'Manage artwork stock quantities, reserved inventory states, and made-to-order preparation queues.',
          status: 'AVAILABLE',
          path: '/admin/inventory',
        },
        {
          id: 'promotions',
          name: 'Promotions & Coupon Discounts',
          description:
            'Create promotional coupon codes, configure discount rates, set minimum subtotal requirements, and manage usage limits.',
          status: 'AVAILABLE',
          path: '/admin/coupons',
        },
      ],
    };
  }

  /**
   * Promotes an existing, active customer account to ADMIN.
   * Used exclusively by the operator provisioning CLI script.
   * Safe for repeated execution (idempotent).
   */
  public async promoteUserToAdmin(email: string): Promise<PromoteAdminResult> {
    const normalizedEmail = validateEmail(email);

    const user = await this.userRepo.findByEmail(normalizedEmail);
    if (!user) {
      throw new NotFoundError(
        `No account found with email: ${normalizedEmail}. Please ensure the user has registered first.`
      );
    }

    if (!user.isActive) {
      throw new BadRequestError(
        `Account ${normalizedEmail} is deactivated. Deactivated accounts cannot be promoted to ADMIN.`
      );
    }

    if (user.role === UserRole.ADMIN) {
      return {
        userId: user.id,
        email: user.email,
        role: 'ADMIN',
        alreadyAdmin: true,
      };
    }

    const updatedUser = await this.userRepo.update(user.id, {
      role: UserRole.ADMIN,
    });

    return {
      userId: updatedUser.id,
      email: updatedUser.email,
      role: 'ADMIN',
      alreadyAdmin: false,
    };
  }
}

export const adminService = new AdminService();
