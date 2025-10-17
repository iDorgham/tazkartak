import { Router, type Router as ExpressRouter } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router: ExpressRouter = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     WidgetAnalytics:
 *       type: object
 *       properties:
 *         widgetId:
 *           type: string
 *         organizerId:
 *           type: string
 *         eventId:
 *           type: string
 *         action:
 *           type: string
 *           enum: [load, view, ticket_select, checkout_start, checkout_complete, purchase, error]
 *         metadata:
 *           type: object
 *         timestamp:
 *           type: string
 *           format: date-time
 *     
 *     AnalyticsSummary:
 *       type: object
 *       properties:
 *         totalLoads:
 *           type: number
 *         totalViews:
 *           type: number
 *         totalTicketSelections:
 *           type: number
 *         totalCheckouts:
 *           type: number
 *         totalPurchases:
 *           type: number
 *         totalErrors:
 *           type: number
 *         conversionRate:
 *           type: number
 *         revenue:
 *           type: number
 */

/**
 * @swagger
 * /api/analytics/widget:
 *   get:
 *     summary: Get widget analytics for an organizer
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: eventId
 *         schema:
 *           type: string
 *         description: Filter by event ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics
 *     responses:
 *       200:
 *         description: Widget analytics retrieved successfully
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
 *                     $ref: '#/components/schemas/WidgetAnalytics'
 *                 count:
 *                   type: number
 *       401:
 *         description: Unauthorized
 */
router.get('/widget', 
  authMiddleware, 
  AnalyticsController.getWidgetAnalytics
);

/**
 * @swagger
 * /api/analytics/summary:
 *   get:
 *     summary: Get analytics summary for an organizer
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: eventId
 *         schema:
 *           type: string
 *         description: Filter by event ID
 *     responses:
 *       200:
 *         description: Analytics summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/AnalyticsSummary'
 *       401:
 *         description: Unauthorized
 */
router.get('/summary', 
  authMiddleware, 
  AnalyticsController.getAnalyticsSummary
);

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Get real-time analytics dashboard data
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       $ref: '#/components/schemas/AnalyticsSummary'
 *                     recentAnalytics:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/WidgetAnalytics'
 *                     hourlyBreakdown:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           hour:
 *                             type: string
 *                           loads:
 *                             type: number
 *                           views:
 *                             type: number
 *                           purchases:
 *                             type: number
 *                           revenue:
 *                             type: number
 *                     connectedClients:
 *                       type: object
 *                       properties:
 *                         widget:
 *                           type: number
 *                         organizer:
 *                           type: number
 *                     lastUpdated:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get('/dashboard', 
  authMiddleware, 
  AnalyticsController.getRealtimeDashboard
);

/**
 * @swagger
 * /api/analytics/track:
 *   post:
 *     summary: Track custom analytics event
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [load, view, ticket_select, checkout_start, checkout_complete, purchase, error]
 *               eventId:
 *                 type: string
 *               metadata:
 *                 type: object
 *                 properties:
 *                   ticketType:
 *                     type: string
 *                   quantity:
 *                     type: number
 *                   amount:
 *                     type: number
 *                   error:
 *                     type: string
 *     responses:
 *       200:
 *         description: Analytics event tracked successfully
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
 *       401:
 *         description: Unauthorized
 */
router.post('/track', 
  authMiddleware, 
  AnalyticsController.trackCustomEvent
);

/**
 * @swagger
 * /api/analytics/events/{eventId}:
 *   get:
 *     summary: Get analytics for a specific event
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics
 *     responses:
 *       200:
 *         description: Event analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     analytics:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/WidgetAnalytics'
 *                     summary:
 *                       $ref: '#/components/schemas/AnalyticsSummary'
 *                     funnel:
 *                       type: object
 *                       properties:
 *                         loads:
 *                           type: number
 *                         views:
 *                           type: number
 *                         ticketSelections:
 *                           type: number
 *                         checkouts:
 *                           type: number
 *                         purchases:
 *                           type: number
 *                         conversionRates:
 *                           type: object
 *                           properties:
 *                             loadToView:
 *                               type: number
 *                             viewToSelection:
 *                               type: number
 *                             selectionToCheckout:
 *                               type: number
 *                             checkoutToPurchase:
 *                               type: number
 *                             overall:
 *                               type: number
 *                     count:
 *                       type: number
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event not found
 */
router.get('/events/:eventId', 
  authMiddleware, 
  AnalyticsController.getEventAnalytics
);

export default router;