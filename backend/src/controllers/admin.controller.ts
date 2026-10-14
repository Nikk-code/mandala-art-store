import type { Request, Response, NextFunction } from 'express';
import { adminService, type AdminService } from '../services/admin.service';
import type { ApiSuccessResponse } from '../types';
import type { AdminDashboardResponseData } from '../types/admin';

export class AdminController {
  constructor(private service: AdminService = adminService) {}

  /**
   * GET /api/admin/dashboard
   * Returns authenticated administrator profile and supported dashboard module metadata.
   */
  public getDashboard = async (
    req: Request,
    res: Response<ApiSuccessResponse<AdminDashboardResponseData>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dashboardData = await this.service.getDashboardData(req.user!.id);
      res.status(200).json({
        success: true,
        data: dashboardData,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const adminController = new AdminController();
