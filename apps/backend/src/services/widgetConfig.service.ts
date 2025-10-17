import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.config';
import { logger } from '../utils/logger.util';
import { CustomError } from '../middleware/errorHandler.middleware';

export interface CreateWidgetConfigData {
  organizerId: string;
  theme: Record<string, any>;
  layout: Record<string, any>;
  features: Record<string, any>;
  customCss?: string;
  customJs?: string;
}

export interface UpdateWidgetConfigData {
  theme?: Record<string, any>;
  layout?: Record<string, any>;
  features?: Record<string, any>;
  customCss?: string;
  customJs?: string;
  isActive?: boolean;
}

export interface WidgetConfigWithOrganizer {
  id: string;
  organizerId: string;
  theme: Record<string, any>;
  layout: Record<string, any>;
  features: Record<string, any>;
  customCss?: string;
  customJs?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  organizer: {
    id: string;
    businessName: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

export class WidgetConfigService {
  /**
   * Get widget configuration by organizer ID
   */
  static async getWidgetConfig(
    organizerId: string,
    userId: string
  ): Promise<WidgetConfigWithOrganizer | null> {
    try {
      // Verify user has access to this organizer
      const organizer = await prisma.organizer.findFirst({
        where: {
          id: organizerId,
          userId: userId
        }
      });

      if (!organizer) {
        throw new CustomError('Organizer not found or access denied', 404);
      }

      const widgetConfig = await prisma.widgetConfig.findFirst({
        where: {
          organizerId: organizerId
        },
        include: {
          organizer: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        }
      });

      return widgetConfig;
    } catch (error: any) {
      logger.error('Get widget config error:', error);
      throw error;
    }
  }

  /**
   * Create widget configuration
   */
  static async createWidgetConfig(
    data: CreateWidgetConfigData,
    userId: string
  ): Promise<WidgetConfigWithOrganizer> {
    try {
      // Verify user has access to this organizer
      const organizer = await prisma.organizer.findFirst({
        where: {
          id: data.organizerId,
          userId: userId
        }
      });

      if (!organizer) {
        throw new CustomError('Organizer not found or access denied', 404);
      }

      // Check if widget config already exists
      const existingConfig = await prisma.widgetConfig.findFirst({
        where: {
          organizerId: data.organizerId
        }
      });

      if (existingConfig) {
        throw new CustomError('Widget configuration already exists for this organizer', 400);
      }

      const widgetConfig = await prisma.widgetConfig.create({
        data: {
          organizerId: data.organizerId,
          theme: data.theme,
          layout: data.layout,
          features: data.features,
          customCss: data.customCss,
          customJs: data.customJs,
          isActive: true
        },
        include: {
          organizer: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        }
      });

      logger.info(`Widget configuration created for organizer: ${data.organizerId}`);
      return widgetConfig;
    } catch (error: any) {
      logger.error('Create widget config error:', error);
      throw error;
    }
  }

  /**
   * Update widget configuration
   */
  static async updateWidgetConfig(
    id: string,
    data: UpdateWidgetConfigData,
    userId: string
  ): Promise<WidgetConfigWithOrganizer> {
    try {
      // Verify user has access to this widget config
      const existingConfig = await prisma.widgetConfig.findFirst({
        where: {
          id: id,
          organizer: {
            userId: userId
          }
        }
      });

      if (!existingConfig) {
        throw new CustomError('Widget configuration not found or access denied', 404);
      }

      const widgetConfig = await prisma.widgetConfig.update({
        where: { id: id },
        data: {
          ...data,
          updatedAt: new Date()
        },
        include: {
          organizer: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        }
      });

      logger.info(`Widget configuration updated: ${id}`);
      return widgetConfig;
    } catch (error: any) {
      logger.error('Update widget config error:', error);
      throw error;
    }
  }

  /**
   * Delete widget configuration
   */
  static async deleteWidgetConfig(id: string, userId: string): Promise<void> {
    try {
      // Verify user has access to this widget config
      const existingConfig = await prisma.widgetConfig.findFirst({
        where: {
          id: id,
          organizer: {
            userId: userId
          }
        }
      });

      if (!existingConfig) {
        throw new CustomError('Widget configuration not found or access denied', 404);
      }

      await prisma.widgetConfig.delete({
        where: { id: id }
      });

      logger.info(`Widget configuration deleted: ${id}`);
    } catch (error: any) {
      logger.error('Delete widget config error:', error);
      throw error;
    }
  }

  /**
   * Activate widget configuration
   */
  static async activateWidgetConfig(
    id: string,
    userId: string
  ): Promise<WidgetConfigWithOrganizer> {
    try {
      // Verify user has access to this widget config
      const existingConfig = await prisma.widgetConfig.findFirst({
        where: {
          id: id,
          organizer: {
            userId: userId
          }
        }
      });

      if (!existingConfig) {
        throw new CustomError('Widget configuration not found or access denied', 404);
      }

      const widgetConfig = await prisma.widgetConfig.update({
        where: { id: id },
        data: {
          isActive: true,
          updatedAt: new Date()
        },
        include: {
          organizer: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        }
      });

      logger.info(`Widget configuration activated: ${id}`);
      return widgetConfig;
    } catch (error: any) {
      logger.error('Activate widget config error:', error);
      throw error;
    }
  }

  /**
   * Deactivate widget configuration
   */
  static async deactivateWidgetConfig(
    id: string,
    userId: string
  ): Promise<WidgetConfigWithOrganizer> {
    try {
      // Verify user has access to this widget config
      const existingConfig = await prisma.widgetConfig.findFirst({
        where: {
          id: id,
          organizer: {
            userId: userId
          }
        }
      });

      if (!existingConfig) {
        throw new CustomError('Widget configuration not found or access denied', 404);
      }

      const widgetConfig = await prisma.widgetConfig.update({
        where: { id: id },
        data: {
          isActive: false,
          updatedAt: new Date()
        },
        include: {
          organizer: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        }
      });

      logger.info(`Widget configuration deactivated: ${id}`);
      return widgetConfig;
    } catch (error: any) {
      logger.error('Deactivate widget config error:', error);
      throw error;
    }
  }

  /**
   * Get active widget configuration for public access
   */
  static async getActiveWidgetConfig(organizerId: string): Promise<any | null> {
    try {
      const widgetConfig = await prisma.widgetConfig.findFirst({
        where: {
          organizerId: organizerId,
          isActive: true
        }
      });

      return widgetConfig;
    } catch (error: any) {
      logger.error('Get active widget config error:', error);
      throw error;
    }
  }

  /**
   * Get widget configuration by ID (public access)
   */
  static async getWidgetConfigById(id: string): Promise<any | null> {
    try {
      const widgetConfig = await prisma.widgetConfig.findUnique({
        where: { id: id }
      });

      return widgetConfig;
    } catch (error: any) {
      logger.error('Get widget config by ID error:', error);
      throw error;
    }
  }
}

export const widgetConfigService = new WidgetConfigService();