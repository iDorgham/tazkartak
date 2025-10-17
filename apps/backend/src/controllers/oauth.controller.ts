import { Request, Response } from 'express';
import { oauthService } from '../services/oauth.service';
import { logger } from '../utils/logger.util';
import { CustomError } from '../middleware/errorHandler.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

export class OAuthController {
  /**
   * Create OAuth client
   */
  static async createClient(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { name, redirectUris, scopes } = req.body;

      if (!userId) {
        throw new CustomError('User not authenticated', 401);
      }

      if (!name || !redirectUris || !Array.isArray(redirectUris)) {
        throw new CustomError('Name and redirectUris are required', 400);
      }

      // Validate scopes
      if (scopes && !oauthService.validateScopes(scopes)) {
        throw new CustomError('Invalid scopes provided', 400);
      }

      const client = await oauthService.createClient(
        userId,
        name,
        redirectUris,
        scopes || ['read', 'write']
      );

      res.status(201).json({
        success: true,
        data: client,
        message: 'OAuth client created successfully. Please save the client secret securely.',
      });
    } catch (error: any) {
      logger.error('Create OAuth client error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to create OAuth client',
      });
    }
  }

  /**
   * List OAuth clients
   */
  static async listClients(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new CustomError('User not authenticated', 401);
      }

      const clients = await oauthService.getClientsByOrganizer(userId);

      res.status(200).json({
        success: true,
        data: clients,
        count: clients.length,
      });
    } catch (error: any) {
      logger.error('List OAuth clients error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to list OAuth clients',
      });
    }
  }

  /**
   * Get OAuth client details
   */
  static async getClient(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { clientId } = req.params;

      if (!userId) {
        throw new CustomError('User not authenticated', 401);
      }

      const clients = await oauthService.getClientsByOrganizer(userId);
      const client = clients.find(c => c.clientId === clientId);

      if (!client) {
        throw new CustomError('OAuth client not found', 404);
      }

      res.status(200).json({
        success: true,
        data: client,
      });
    } catch (error: any) {
      logger.error('Get OAuth client error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to get OAuth client',
      });
    }
  }

  /**
   * Update OAuth client
   */
  static async updateClient(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { clientId } = req.params;
      const { name, redirectUris, scopes, isActive } = req.body;

      if (!userId) {
        throw new CustomError('User not authenticated', 401);
      }

      // Validate scopes if provided
      if (scopes && !oauthService.validateScopes(scopes)) {
        throw new CustomError('Invalid scopes provided', 400);
      }

      const client = await oauthService.updateClient(clientId, userId, {
        name,
        redirectUris,
        scopes,
        isActive,
      });

      res.status(200).json({
        success: true,
        data: client,
        message: 'OAuth client updated successfully',
      });
    } catch (error: any) {
      logger.error('Update OAuth client error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to update OAuth client',
      });
    }
  }

  /**
   * Delete OAuth client
   */
  static async deleteClient(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { clientId } = req.params;

      if (!userId) {
        throw new CustomError('User not authenticated', 401);
      }

      await oauthService.deleteClient(clientId, userId);

      res.status(200).json({
        success: true,
        message: 'OAuth client deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete OAuth client error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to delete OAuth client',
      });
    }
  }

  /**
   * OAuth authorization endpoint
   */
  static async authorize(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        response_type,
        client_id,
        redirect_uri,
        scope,
        state,
      } = req.query;

      // Validate required parameters
      if (response_type !== 'code') {
        throw new CustomError('Unsupported response type', 400);
      }

      if (!client_id || !redirect_uri) {
        throw new CustomError('Missing required parameters', 400);
      }

      // Validate client
      const client = await oauthService.getClient(client_id as string);
      if (!client) {
        throw new CustomError('Invalid client ID', 400);
      }

      if (!client.redirectUris.includes(redirect_uri as string)) {
        throw new CustomError('Invalid redirect URI', 400);
      }

      // Validate scopes
      const requestedScopes = scope ? (scope as string).split(' ') : ['read', 'write'];
      if (!oauthService.validateScopes(requestedScopes)) {
        throw new CustomError('Invalid scopes', 400);
      }

      // If user is not authenticated, redirect to login
      if (!req.user) {
        const loginUrl = `/login?redirect=${encodeURIComponent(req.originalUrl)}`;
        return res.redirect(loginUrl);
      }

      // Generate authorization code
      const code = await oauthService.generateAuthorizationCode(
        client_id as string,
        req.user.id,
        redirect_uri as string,
        requestedScopes
      );

      // Redirect to client with authorization code
      const redirectUrl = new URL(redirect_uri as string);
      redirectUrl.searchParams.set('code', code);
      if (state) {
        redirectUrl.searchParams.set('state', state as string);
      }

      res.redirect(redirectUrl.toString());
    } catch (error: any) {
      logger.error('OAuth authorization error:', error);
      
      const errorParams = new URLSearchParams({
        error: 'server_error',
        error_description: error.message || 'An error occurred during authorization',
      });

      if (req.query.state) {
        errorParams.set('state', req.query.state as string);
      }

      if (req.query.redirect_uri) {
        const redirectUrl = new URL(req.query.redirect_uri as string);
        redirectUrl.search = errorParams.toString();
        return res.redirect(redirectUrl.toString());
      }

      res.status(400).json({
        error: 'server_error',
        error_description: error.message || 'An error occurred during authorization',
      });
    }
  }

  /**
   * OAuth token endpoint
   */
  static async token(req: Request, res: Response): Promise<void> {
    try {
      const { grant_type } = req.body;

      if (grant_type === 'authorization_code') {
        await OAuthController.handleAuthorizationCodeGrant(req, res);
      } else if (grant_type === 'refresh_token') {
        await OAuthController.handleRefreshTokenGrant(req, res);
      } else {
        throw new CustomError('Unsupported grant type', 400);
      }
    } catch (error: any) {
      logger.error('OAuth token error:', error);
      res.status(error.statusCode || 400).json({
        error: 'invalid_request',
        error_description: error.message || 'An error occurred during token exchange',
      });
    }
  }

  /**
   * Handle authorization code grant
   */
  private static async handleAuthorizationCodeGrant(req: Request, res: Response): Promise<void> {
    const { code, client_id, client_secret, redirect_uri } = req.body;

    if (!code || !client_id || !client_secret || !redirect_uri) {
      throw new CustomError('Missing required parameters', 400);
    }

    const tokenResponse = await oauthService.exchangeCodeForToken(
      code,
      client_id,
      client_secret,
      redirect_uri
    );

    res.status(200).json(tokenResponse);
  }

  /**
   * Handle refresh token grant
   */
  private static async handleRefreshTokenGrant(req: Request, res: Response): Promise<void> {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      throw new CustomError('Missing refresh token', 400);
    }

    const tokenResponse = await oauthService.refreshAccessToken(refresh_token);

    res.status(200).json(tokenResponse);
  }

  /**
   * Revoke token endpoint
   */
  static async revoke(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;

      if (!token) {
        throw new CustomError('Missing token', 400);
      }

      await oauthService.revokeToken(token);

      res.status(200).json({
        success: true,
        message: 'Token revoked successfully',
      });
    } catch (error: any) {
      logger.error('OAuth revoke error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to revoke token',
      });
    }
  }

  /**
   * Get supported scopes
   */
  static async getScopes(req: Request, res: Response): Promise<void> {
    try {
      const scopes = oauthService.getSupportedScopes();

      res.status(200).json({
        success: true,
        data: scopes,
      });
    } catch (error: any) {
      logger.error('Get scopes error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get supported scopes',
      });
    }
  }
}

export const oauthController = new OAuthController();