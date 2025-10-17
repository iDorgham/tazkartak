import { Router, type Router as ExpressRouter } from 'express';
import { WidgetConfigController } from '../controllers/widgetConfig.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router: ExpressRouter = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     WidgetConfig:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         organizerId:
 *           type: string
 *         theme:
 *           type: object
 *         layout:
 *           type: object
 *         features:
 *           type: object
 *         customCss:
 *           type: string
 *         customJs:
 *           type: string
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/widget-config:
 *   get:
 *     summary: Get widget configuration
 *     tags: [Widget Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizerId
 *         schema:
 *           type: string
 *         description: Organizer ID
 *     responses:
 *       200:
 *         description: Widget configuration retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/WidgetConfig'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Widget configuration not found
 */
router.get('/', 
  authMiddleware, 
  WidgetConfigController.getWidgetConfig
);

/**
 * @swagger
 * /api/widget-config:
 *   post:
 *     summary: Create widget configuration
 *     tags: [Widget Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organizerId
 *               - theme
 *               - layout
 *               - features
 *             properties:
 *               organizerId:
 *                 type: string
 *               theme:
 *                 type: object
 *               layout:
 *                 type: object
 *               features:
 *                 type: object
 *               customCss:
 *                 type: string
 *               customJs:
 *                 type: string
 *     responses:
 *       201:
 *         description: Widget configuration created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/WidgetConfig'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/', 
  authMiddleware, 
  WidgetConfigController.createWidgetConfig
);

/**
 * @swagger
 * /api/widget-config/{id}:
 *   put:
 *     summary: Update widget configuration
 *     tags: [Widget Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Widget configuration ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               theme:
 *                 type: object
 *               layout:
 *                 type: object
 *               features:
 *                 type: object
 *               customCss:
 *                 type: string
 *               customJs:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Widget configuration updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/WidgetConfig'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Widget configuration not found
 */
router.put('/:id', 
  authMiddleware, 
  WidgetConfigController.updateWidgetConfig
);

/**
 * @swagger
 * /api/widget-config/{id}:
 *   delete:
 *     summary: Delete widget configuration
 *     tags: [Widget Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Widget configuration ID
 *     responses:
 *       200:
 *         description: Widget configuration deleted successfully
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
 *         description: Widget configuration not found
 */
router.delete('/:id', 
  authMiddleware, 
  WidgetConfigController.deleteWidgetConfig
);

/**
 * @swagger
 * /api/widget-config/{id}/activate:
 *   patch:
 *     summary: Activate widget configuration
 *     tags: [Widget Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Widget configuration ID
 *     responses:
 *       200:
 *         description: Widget configuration activated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/WidgetConfig'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Widget configuration not found
 */
router.patch('/:id/activate', 
  authMiddleware, 
  WidgetConfigController.activateWidgetConfig
);

/**
 * @swagger
 * /api/widget-config/{id}/deactivate:
 *   patch:
 *     summary: Deactivate widget configuration
 *     tags: [Widget Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Widget configuration ID
 *     responses:
 *       200:
 *         description: Widget configuration deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/WidgetConfig'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Widget configuration not found
 */
router.patch('/:id/deactivate', 
  authMiddleware, 
  WidgetConfigController.deactivateWidgetConfig
);

export default router;