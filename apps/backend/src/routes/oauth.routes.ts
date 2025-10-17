import { Router, type Router as ExpressRouter } from 'express';
import { OAuthController } from '../controllers/oauth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router: ExpressRouter = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     OAuthClient:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         clientId:
 *           type: string
 *         clientSecret:
 *           type: string
 *         redirectUris:
 *           type: array
 *           items:
 *             type: string
 *         scopes:
 *           type: array
 *           items:
 *             type: string
 *         isActive:
 *           type: boolean
 *         organizerId:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     OAuthTokenResponse:
 *       type: object
 *       properties:
 *         access_token:
 *           type: string
 *         token_type:
 *           type: string
 *           enum: [Bearer]
 *         expires_in:
 *           type: number
 *         refresh_token:
 *           type: string
 *         scope:
 *           type: string
 *     
 *     OAuthErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *         error_description:
 *           type: string
 *         error_uri:
 *           type: string
 */

/**
 * @swagger
 * /api/oauth/clients:
 *   post:
 *     summary: Create OAuth client
 *     tags: [OAuth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - redirectUris
 *             properties:
 *               name:
 *                 type: string
 *                 description: Client application name
 *               redirectUris:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Allowed redirect URIs
 *               scopes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Requested scopes
 *                 enum: [read, write, events:read, events:write, tickets:read, tickets:write, analytics:read, webhooks:read, webhooks:write]
 *     responses:
 *       201:
 *         description: OAuth client created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/OAuthClient'
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/clients', 
  authMiddleware, 
  OAuthController.createClient
);

/**
 * @swagger
 * /api/oauth/clients:
 *   get:
 *     summary: List OAuth clients
 *     tags: [OAuth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OAuth clients retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/OAuthClient'
 *                 count:
 *                   type: number
 *       401:
 *         description: Unauthorized
 */
router.get('/clients', 
  authMiddleware, 
  OAuthController.listClients
);

/**
 * @swagger
 * /api/oauth/clients/{clientId}:
 *   get:
 *     summary: Get OAuth client details
 *     tags: [OAuth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: OAuth client ID
 *     responses:
 *       200:
 *         description: OAuth client retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/OAuthClient'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: OAuth client not found
 */
router.get('/clients/:clientId', 
  authMiddleware, 
  OAuthController.getClient
);

/**
 * @swagger
 * /api/oauth/clients/{clientId}:
 *   put:
 *     summary: Update OAuth client
 *     tags: [OAuth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: OAuth client ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               redirectUris:
 *                 type: array
 *                 items:
 *                   type: string
 *               scopes:
 *                 type: array
 *                 items:
 *                   type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: OAuth client updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/OAuthClient'
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: OAuth client not found
 */
router.put('/clients/:clientId', 
  authMiddleware, 
  OAuthController.updateClient
);

/**
 * @swagger
 * /api/oauth/clients/{clientId}:
 *   delete:
 *     summary: Delete OAuth client
 *     tags: [OAuth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: OAuth client ID
 *     responses:
 *       200:
 *         description: OAuth client deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: OAuth client not found
 */
router.delete('/clients/:clientId', 
  authMiddleware, 
  OAuthController.deleteClient
);

/**
 * @swagger
 * /api/oauth/authorize:
 *   get:
 *     summary: OAuth authorization endpoint
 *     tags: [OAuth]
 *     parameters:
 *       - in: query
 *         name: response_type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [code]
 *         description: Response type (must be 'code')
 *       - in: query
 *         name: client_id
 *         required: true
 *         schema:
 *           type: string
 *         description: OAuth client ID
 *       - in: query
 *         name: redirect_uri
 *         required: true
 *         schema:
 *           type: string
 *         description: Redirect URI
 *       - in: query
 *         name: scope
 *         schema:
 *           type: string
 *         description: Space-separated list of scopes
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: State parameter for CSRF protection
 *     responses:
 *       302:
 *         description: Redirect to client with authorization code or error
 *       400:
 *         description: Bad request
 */
router.get('/authorize', 
  OAuthController.authorize
);

/**
 * @swagger
 * /api/oauth/token:
 *   post:
 *     summary: OAuth token endpoint
 *     tags: [OAuth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 required:
 *                   - grant_type
 *                   - code
 *                   - client_id
 *                   - client_secret
 *                   - redirect_uri
 *                 properties:
 *                   grant_type:
 *                     type: string
 *                     enum: [authorization_code]
 *                   code:
 *                     type: string
 *                   client_id:
 *                     type: string
 *                   client_secret:
 *                     type: string
 *                   redirect_uri:
 *                     type: string
 *               - type: object
 *                 required:
 *                   - grant_type
 *                   - refresh_token
 *                 properties:
 *                   grant_type:
 *                     type: string
 *                     enum: [refresh_token]
 *                   refresh_token:
 *                     type: string
 *     responses:
 *       200:
 *         description: Token response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OAuthTokenResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OAuthErrorResponse'
 */
router.post('/token', 
  OAuthController.token
);

/**
 * @swagger
 * /api/oauth/revoke:
 *   post:
 *     summary: Revoke OAuth token
 *     tags: [OAuth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Access token or refresh token to revoke
 *     responses:
 *       200:
 *         description: Token revoked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request
 */
router.post('/revoke', 
  OAuthController.revoke
);

/**
 * @swagger
 * /api/oauth/scopes:
 *   get:
 *     summary: Get supported OAuth scopes
 *     tags: [OAuth]
 *     responses:
 *       200:
 *         description: Supported scopes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get('/scopes', 
  OAuthController.getScopes
);

export default router;