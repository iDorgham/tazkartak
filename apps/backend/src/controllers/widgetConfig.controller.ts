import { Request, Response } from 'express';
import { WidgetConfigService } from '../services/widgetConfig.service';
import { logger } from '../utils/logger.util';
import { CustomError } from '../middleware/errorHandler.middleware';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export class WidgetConfigController {
  /**
   * Get widget configuration
   */
  static async getWidgetConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { organizerId } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        throw new CustomError('User not authenticated', 401);
      }

      const widgetConfig = await WidgetConfigService.getWidgetConfig(
        organizerId as string,
        userId
      );

      res.status(200).json({
        success: true,
        data: widgetConfig
      });
    } catch (error: any) {
      logger.error('Get widget config error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to get widget configuration'
      });
    }
  }

  /**
   * Create widget configuration
   */
  static async createWidgetConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const widgetConfigData = req.body;

      if (!userId) {
        throw new CustomError('User not authenticated', 401);
      }

      const widgetConfig = await WidgetConfigService.createWidgetConfig(
        widgetConfigData,
        userId
      );

      res.status(201).json({
        success: true,
        data: widgetConfig
      });
    } catch (error: any) {
      logger.error('Create widget config error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to create widget configuration'
      });
    }
  }

  /**
   * Update widget configuration
   */
  static async updateWidgetConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const updateData = req.body;

      if (!userId) {
        throw new CustomError('User not authenticated', 401);
      }

      const widgetConfig = await WidgetConfigService.updateWidgetConfig(
        id,
        updateData,
        userId
      );

      res.status(200).json({
        success: true,
        data: widgetConfig
      });
    } catch (error: any) {
      logger.error('Update widget config error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to update widget configuration'
      });
    }
  }

  /**
   * Delete widget configuration
   */
  static async deleteWidgetConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        throw new CustomError('User not authenticated', 401);
      }

      await WidgetConfigService.deleteWidgetConfig(id, userId);

      res.status(200).json({
        success: true,
        message: 'Widget configuration deleted successfully'
      });
    } catch (error: any) {
      logger.error('Delete widget config error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to delete widget configuration'
      });
    }
  }

  /**
   * Activate widget configuration
   */
  static async activateWidgetConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        throw new CustomError('User not authenticated', 401);
      }

      const widgetConfig = await WidgetConfigService.activateWidgetConfig(
        id,
        userId
      );

      res.status(200).json({
        success: true,
        data: widgetConfig
      });
    } catch (error: any) {
      logger.error('Activate widget config error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to activate widget configuration'
      });
    }
  }

  /**
   * Deactivate widget configuration
   */
  static async deactivateWidgetConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        throw new CustomError('User not authenticated', 401);
      }

      const widgetConfig = await WidgetConfigService.deactivateWidgetConfig(
        id,
        userId
      );

      res.status(200).json({
        success: true,
        data: widgetConfig
      });
    } catch (error: any) {
      logger.error('Deactivate widget config error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to deactivate widget configuration'
      });
    }
  }
}

export const widgetConfigController = new WidgetConfigController();