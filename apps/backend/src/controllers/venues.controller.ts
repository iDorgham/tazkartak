import { Request, Response, NextFunction } from 'express';
import { ApiResponse, PaginatedResponse } from '../types/api.types';
import { VenueService, CreateVenueData, UpdateVenueData, VenueFilters } from '../services/venue.service';
import { logger } from '../utils/logger.util';
import { CustomError } from '../middleware/errorHandler.middleware';
import { VenueStatus } from '@prisma/client';
import prisma from '../config/database.config';

export const venuesController = {
  /**
   * Get venues with filtering and pagination
   */
  getVenues: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        search,
        city,
        minCapacity,
        amenities,
        status,
        page = 1,
        limit = 10,
        sortBy = 'name',
        sortOrder = 'asc'
      } = req.query;

      const filters: VenueFilters = {
        search: search as string,
        city: city as string,
        minCapacity: minCapacity ? parseInt(minCapacity as string) : undefined,
        amenities: amenities ? (amenities as string).split(',') : undefined,
        status: status as VenueStatus,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as any,
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const result = await VenueService.getVenues(filters);

      const response: PaginatedResponse = {
        success: true,
        message: 'Venues retrieved successfully',
        data: result.venues,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          pages: result.totalPages,
          hasNext: result.page < result.totalPages,
          hasPrev: result.page > 1
        }
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get venue by ID
   */
  getVenueById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new CustomError('Venue ID is required', 400);
      }

      const venue = await VenueService.getVenueById(id);

      const response: ApiResponse = {
        success: true,
        message: 'Venue retrieved successfully',
        data: venue
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create a new venue
   */
  createVenue: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        name,
        description,
        location,
        address,
        city,
        capacity,
        amenities,
        contactEmail,
        contactPhone,
        website,
        images,
        latitude,
        longitude
      } = req.body;

      const userId = (req as any).user?.id;
      if (!userId) {
        throw new CustomError('User not authenticated', 401);
      }

      // Get venue owner ID from user
      const venueOwner = await prisma.venueOwner.findUnique({
        where: { userId }
      });

      if (!venueOwner) {
        throw new CustomError('User is not a venue owner', 403);
      }

      const venueData: CreateVenueData = {
        name,
        description,
        location,
        address,
        city,
        capacity: parseInt(capacity),
        amenities: amenities || [],
        contactEmail,
        contactPhone,
        website,
        images: images || [],
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        ownerId: venueOwner.id
      };

      const venue = await VenueService.createVenue(venueData);

      const response: ApiResponse = {
        success: true,
        message: 'Venue created successfully',
        data: venue
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update a venue
   */
  updateVenue: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id) {
        throw new CustomError('Venue ID is required', 400);
      }

      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      // Check if user can update this venue
      const venue = await VenueService.getVenueById(id);
      const venueOwner = await prisma.venueOwner.findUnique({
        where: { userId }
      });

      if (userRole !== 'ADMIN' && (!venueOwner || venue.ownerId !== venueOwner.id)) {
        throw new CustomError('Not authorized to update this venue', 403);
      }

      // Convert numeric fields
      if (updateData.capacity) {
        updateData.capacity = parseInt(updateData.capacity);
      }
      if (updateData.latitude) {
        updateData.latitude = parseFloat(updateData.latitude);
      }
      if (updateData.longitude) {
        updateData.longitude = parseFloat(updateData.longitude);
      }

      const updatedVenue = await VenueService.updateVenue(id, updateData);

      const response: ApiResponse = {
        success: true,
        message: 'Venue updated successfully',
        data: updatedVenue
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete a venue
   */
  deleteVenue: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new CustomError('Venue ID is required', 400);
      }

      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      // Check if user can delete this venue
      const venue = await VenueService.getVenueById(id);
      const venueOwner = await prisma.venueOwner.findUnique({
        where: { userId }
      });

      if (userRole !== 'ADMIN' && (!venueOwner || venue.ownerId !== venueOwner.id)) {
        throw new CustomError('Not authorized to delete this venue', 403);
      }

      await VenueService.deleteVenue(id);

      const response: ApiResponse = {
        success: true,
        message: 'Venue deleted successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Verify a venue (Admin only)
   */
  verifyVenue: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { isVerified, verificationNotes } = req.body;

      if (!id) {
        throw new CustomError('Venue ID is required', 400);
      }

      const userRole = (req as any).user?.role;
      if (userRole !== 'ADMIN') {
        throw new CustomError('Not authorized to verify venues', 403);
      }

      const updatedVenue = await VenueService.verifyVenue(id, {
        isVerified,
        verificationNotes,
        verifiedBy: (req as any).user?.id,
        verifiedAt: new Date()
      });

      const response: ApiResponse = {
        success: true,
        message: 'Venue verification updated successfully',
        data: updatedVenue
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get venues by owner
   */
  getVenuesByOwner: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new CustomError('User not authenticated', 401);
      }

      const venueOwner = await prisma.venueOwner.findUnique({
        where: { userId }
      });

      if (!venueOwner) {
        throw new CustomError('User is not a venue owner', 403);
      }

      const {
        search,
        status,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const filters: Omit<VenueFilters, 'ownerId'> = {
        search: search as string,
        status: status as VenueStatus,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as any,
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const result = await VenueService.getVenuesByOwner(venueOwner.id, filters);

      const response: PaginatedResponse = {
        success: true,
        message: 'Owner venues retrieved successfully',
        data: result.venues,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          pages: result.totalPages,
          hasNext: result.page < result.totalPages,
          hasPrev: result.page > 1
        }
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get venue statistics
   */
  getVenueStats: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new CustomError('Venue ID is required', 400);
      }

      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      // Check if user can view this venue's stats
      const venue = await VenueService.getVenueById(id);
      const venueOwner = await prisma.venueOwner.findUnique({
        where: { userId }
      });

      if (userRole !== 'ADMIN' && (!venueOwner || venue.ownerId !== venueOwner.id)) {
        throw new CustomError('Not authorized to view this venue stats', 403);
      }

      const stats = await VenueService.getVenueStats(id);

      const response: ApiResponse = {
        success: true,
        message: 'Venue statistics retrieved successfully',
        data: stats
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get available amenities
   */
  getAvailableAmenities: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const amenities = await VenueService.getAvailableAmenities();

      const response: ApiResponse = {
        success: true,
        message: 'Available amenities retrieved successfully',
        data: amenities
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get cities with venues
   */
  getCitiesWithVenues: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cities = await VenueService.getCitiesWithVenues();

      const response: ApiResponse = {
        success: true,
        message: 'Cities with venues retrieved successfully',
        data: cities
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
};

