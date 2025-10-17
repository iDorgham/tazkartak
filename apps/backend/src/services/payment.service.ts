import { prisma } from '../config/database.config';
import { paymobService } from './paymob.service';
import { fawryService } from './fawry.service';
import { subscriptionService } from './subscription.service';
import { logger } from '../utils/logger.util';
import { v4 as uuidv4 } from 'uuid';

export interface PaymentInitiationData {
  eventId: string;
  ticketTypeId: string;
  quantity: number;
  amount: number;
  currency: string;
  paymentMethod: 'paymob_card' | 'fawry_card' | 'fawry_wallet' | 'fawry_valu' | 'fawry_payat' | 'fawry_atm' | 'fawry_mwallet';
  customerData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  buyerId: string;
  returnUrl?: string;
}

export interface PaymentInitiationResult {
  success: boolean;
  paymentId: string;
  paymentUrl?: string;
  iframeUrl?: string;
  qrCodeUrl?: string;
  referenceNumber?: string;
  orderId?: string;
  expiresAt: Date;
}

export interface PaymentCallbackData {
  paymentId: string;
  transactionId: string;
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: 'success' | 'failed' | 'pending';
  customerData: {
    email: string;
    phone: string;
    name: string;
  };
  gatewayData?: any;
}

export interface PaymentRefundData {
  paymentId: string;
  amount: number;
  reason: string;
}

class PaymentService {
  /**
   * Initiate payment with selected gateway
   */
  async initiatePayment(data: PaymentInitiationData): Promise<PaymentInitiationResult> {
    try {
      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          id: uuidv4(),
          amount: data.amount,
          currency: data.currency,
          status: 'PENDING',
          paymentMethod: data.paymentMethod,
          buyerId: data.buyerId,
          eventId: data.eventId,
          metadata: {
            ticketTypeId: data.ticketTypeId,
            quantity: data.quantity,
            customerData: data.customerData,
          },
        },
      });

      let result: PaymentInitiationResult;

      if (data.paymentMethod === 'paymob_card') {
        result = await this.initiatePayMobPayment(payment.id, data);
      } else if (data.paymentMethod.startsWith('fawry_')) {
        result = await this.initiateFawryPayment(payment.id, data);
      } else {
        throw new Error(`Unsupported payment method: ${data.paymentMethod}`);
      }

      // Update payment record with gateway data
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          gatewayTransactionId: result.orderId || result.referenceNumber,
          gatewayData: {
            paymentUrl: result.paymentUrl,
            iframeUrl: result.iframeUrl,
            qrCodeUrl: result.qrCodeUrl,
            referenceNumber: result.referenceNumber,
            orderId: result.orderId,
          },
          expiresAt: result.expiresAt,
        },
      });

      logger.info(`Payment initiated: ${payment.id}`, {
        paymentMethod: data.paymentMethod,
        amount: data.amount,
        gatewayOrderId: result.orderId,
      });

      return {
        ...result,
        paymentId: payment.id,
      };
    } catch (error: any) {
      logger.error('Payment initiation failed:', error);
      throw new Error('Payment initiation failed');
    }
  }

  /**
   * Initiate PayMob payment
   */
  private async initiatePayMobPayment(paymentId: string, data: PaymentInitiationData): Promise<PaymentInitiationResult> {
    try {
      // Authenticate with PayMob
      const authToken = await paymobService.authenticate();

      // Create order
      const order = await paymobService.createOrder(
        authToken,
        data.amount,
        data.currency,
        paymentId,
        data.customerData
      );

      // Create payment key
      const paymentKey = await paymobService.createPaymentKey(
        authToken,
        order.id,
        data.amount,
        data.currency,
        data.customerData
      );

      // Generate URLs
      const iframeUrl = paymobService.generateIframeUrl(paymentKey);
      const paymentUrl = paymobService.generatePaymentUrl(paymentKey);

      return {
        success: true,
        paymentId,
        paymentUrl,
        iframeUrl,
        orderId: order.id.toString(),
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
      };
    } catch (error: any) {
      logger.error('PayMob payment initiation failed:', error);
      throw error;
    }
  }

  /**
   * Initiate Fawry payment
   */
  private async initiateFawryPayment(paymentId: string, data: PaymentInitiationData): Promise<PaymentInitiationResult> {
    try {
      // Map payment method
      const fawryMethod = this.mapToFawryPaymentMethod(data.paymentMethod);

      // Create charge request
      const chargeResponse = await fawryService.createChargeRequest({
        merchantRefNum: paymentId,
        customerProfileId: data.buyerId,
        customerMobile: data.customerData.phone,
        customerEmail: data.customerData.email,
        paymentMethod: fawryMethod,
        amount: data.amount,
        description: `Event ticket purchase - Payment ID: ${paymentId}`,
        returnUrl: data.returnUrl,
      });

      let paymentUrl: string | undefined;
      let qrCodeUrl: string | undefined;

      if (fawryMethod === 'PAYATFAWRY') {
        paymentUrl = fawryService.generatePaymentUrl(chargeResponse.referenceNumber, fawryMethod);
        qrCodeUrl = fawryService.generateQRCodeUrl(chargeResponse.referenceNumber);
      } else {
        paymentUrl = chargeResponse.paymentUrl || fawryService.generatePaymentUrl(chargeResponse.referenceNumber, fawryMethod);
      }

      return {
        success: true,
        paymentId,
        paymentUrl,
        qrCodeUrl,
        referenceNumber: chargeResponse.referenceNumber,
        orderId: chargeResponse.merchantRefNumber,
        expiresAt: new Date(chargeResponse.expirationTime),
      };
    } catch (error: any) {
      logger.error('Fawry payment initiation failed:', error);
      throw error;
    }
  }

  /**
   * Process payment callback
   */
  async processCallback(
    gateway: 'paymob' | 'fawry',
    callbackData: any
  ): Promise<PaymentCallbackData> {
    try {
      let result: PaymentCallbackData;

      if (gateway === 'paymob') {
        result = await this.processPayMobCallback(callbackData);
      } else if (gateway === 'fawry') {
        result = await this.processFawryCallback(callbackData);
      } else {
        throw new Error(`Unsupported payment gateway: ${gateway}`);
      }

      // Update payment record
      await this.updatePaymentStatus(result);

      // Handle different payment types
      if (result.status === 'success') {
        if (result.orderId.startsWith('subscription')) {
          // Handle subscription payment
          await this.activateSubscription(result);
        } else {
          // Handle regular ticket payment
          await this.createTicketsForPayment(result);
        }
      }

      logger.info(`Payment callback processed: ${result.paymentId}`, {
        status: result.status,
        transactionId: result.transactionId,
      });

      return result;
    } catch (error: any) {
      logger.error('Payment callback processing failed:', error);
      throw error;
    }
  }

  /**
   * Process PayMob callback
   */
  private async processPayMobCallback(callbackData: any): Promise<PaymentCallbackData> {
    const result = await paymobService.processCallback(callbackData);

    return {
      paymentId: result.orderId,
      transactionId: result.transactionId,
      orderId: result.orderId,
      amount: result.amount,
      currency: result.currency,
      paymentMethod: result.paymentMethod,
      status: result.success ? 'success' : 'failed',
      customerData: result.customerData,
      gatewayData: callbackData,
    };
  }

  /**
   * Process Fawry callback
   */
  private async processFawryCallback(callbackData: any): Promise<PaymentCallbackData> {
    const result = await fawryService.processCallback(callbackData);

    return {
      paymentId: result.orderId,
      transactionId: result.transactionId,
      orderId: result.orderId,
      amount: result.amount,
      currency: result.currency,
      paymentMethod: result.paymentMethod,
      status: result.success ? 'success' : 'failed',
      customerData: result.customerData,
      gatewayData: callbackData,
    };
  }

  /**
   * Update payment status
   */
  private async updatePaymentStatus(callbackData: PaymentCallbackData): Promise<void> {
    const status = callbackData.status === 'success' ? 'COMPLETED' : 
                  callbackData.status === 'failed' ? 'FAILED' : 'PENDING';

    await prisma.payment.update({
      where: { id: callbackData.paymentId },
      data: {
        status,
        gatewayTransactionId: callbackData.transactionId,
        gatewayData: callbackData.gatewayData,
        completedAt: callbackData.status === 'success' ? new Date() : null,
      },
    });
  }

  /**
   * Create tickets for successful payment
   */
  private async createTicketsForPayment(callbackData: PaymentCallbackData): Promise<void> {
    try {
      // Get payment details
      const payment = await prisma.payment.findUnique({
        where: { id: callbackData.paymentId },
        include: {
          event: true,
        },
      });

      if (!payment || !payment.metadata) {
        throw new Error('Payment not found or missing metadata');
      }

      const { ticketTypeId, quantity } = payment.metadata as any;

      // Create tickets
      const tickets = [];
      for (let i = 0; i < quantity; i++) {
        const ticket = await prisma.ticket.create({
          data: {
            id: uuidv4(),
            eventId: payment.eventId,
            buyerId: payment.buyerId,
            paymentId: payment.id,
            price: payment.amount / quantity,
            status: 'CONFIRMED',
            type: 'General Admission', // This should come from ticket type
            seatNumber: null,
            purchaseDate: new Date(),
          },
        });
        tickets.push(ticket);
      }

      logger.info(`Created ${tickets.length} tickets for payment: ${callbackData.paymentId}`);
    } catch (error: any) {
      logger.error('Ticket creation failed:', error);
      throw error;
    }
  }

  /**
   * Process refund
   */
  async processRefund(data: PaymentRefundData): Promise<{
    success: boolean;
    refundId: string;
  }> {
    try {
      // Get payment details
      const payment = await prisma.payment.findUnique({
        where: { id: data.paymentId },
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'COMPLETED') {
        throw new Error('Only completed payments can be refunded');
      }

      let refundResult: { success: boolean; refundId: string };

      if (payment.paymentMethod === 'paymob_card') {
        const authToken = await paymobService.authenticate();
        refundResult = await paymobService.initiateRefund(
          authToken,
          payment.gatewayTransactionId || '',
          data.amount,
          data.reason
        );
      } else if (payment.paymentMethod.startsWith('fawry_')) {
        refundResult = await fawryService.createRefundRequest(
          payment.id,
          payment.gatewayTransactionId || '',
          data.amount,
          data.reason
        );
      } else {
        throw new Error(`Unsupported payment method for refund: ${payment.paymentMethod}`);
      }

      // Update payment status
      await prisma.payment.update({
        where: { id: data.paymentId },
        data: {
          status: 'REFUNDED',
          refundedAmount: data.amount,
          refundedAt: new Date(),
        },
      });

      // Cancel associated tickets
      await prisma.ticket.updateMany({
        where: { paymentId: data.paymentId },
        data: { status: 'CANCELLED' },
      });

      logger.info(`Refund processed: ${data.paymentId}`, {
        refundId: refundResult.refundId,
        amount: data.amount,
      });

      return refundResult;
    } catch (error: any) {
      logger.error('Refund processing failed:', error);
      throw error;
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: string): Promise<{
    id: string;
    status: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    createdAt: Date;
    completedAt?: Date;
  }> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    return {
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      createdAt: payment.createdAt,
      completedAt: payment.completedAt,
    };
  }

  /**
   * Map internal payment method to Fawry method
   */
  private mapToFawryPaymentMethod(method: string): string {
    const methodMap: Record<string, string> = {
      'fawry_card': 'CARD',
      'fawry_wallet': 'WALLET',
      'fawry_valu': 'VALU',
      'fawry_plus': 'FAWRY_PLUS',
      'fawry_atm': 'ATM',
      'fawry_mwallet': 'MWALLET',
      'fawry_payat': 'PAYATFAWRY',
    };

    return methodMap[method] || 'PAYATFAWRY';
  }

  /**
   * Activate subscription after successful payment
   */
  private async activateSubscription(result: PaymentCallbackData): Promise<void> {
    try {
      // Find the subscription by payment ID
      const subscription = await prisma.subscription.findFirst({
        where: {
          id: result.paymentId,
          status: 'PENDING',
        },
      });

      if (!subscription) {
        logger.error(`Subscription not found for payment: ${result.paymentId}`);
        return;
      }

      // Activate the subscription
      await subscriptionService.activateSubscription(subscription.id);

      logger.info(`Subscription activated via payment: ${subscription.id}`);
    } catch (error: any) {
      logger.error('Subscription activation via payment failed:', error);
      throw error;
    }
  }

  /**
   * Get available payment methods
   */
  getAvailablePaymentMethods(): Array<{
    code: string;
    name: string;
    description: string;
    gateway: string;
  }> {
    return [
      {
        code: 'paymob_card',
        name: 'Credit/Debit Card (PayMob)',
        description: 'Pay with your credit or debit card',
        gateway: 'paymob',
      },
      {
        code: 'fawry_card',
        name: 'Credit/Debit Card (Fawry)',
        description: 'Pay with your credit or debit card via Fawry',
        gateway: 'fawry',
      },
      {
        code: 'fawry_wallet',
        name: 'Fawry Wallet',
        description: 'Pay using your Fawry wallet balance',
        gateway: 'fawry',
      },
      {
        code: 'fawry_valu',
        name: 'Valu',
        description: 'Pay using Valu installment service',
        gateway: 'fawry',
      },
      {
        code: 'fawry_payat',
        name: 'Pay at Fawry',
        description: 'Pay cash at any Fawry outlet',
        gateway: 'fawry',
      },
    ];
  }
}

export const paymentService = new PaymentService();
