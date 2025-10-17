import { apiService } from './api.service';
import { API_ENDPOINTS } from '@/utils/constants';
import { Subscription, SubscriptionPlanDetails, SubscriptionUsage } from '@/types/subscription.types';
import { ApiResponse } from '@/types/api.types';

class SubscriptionsService {
  async getCurrentSubscription(): Promise<ApiResponse<Subscription>> {
    const response = await apiService.get<ApiResponse<Subscription>>(API_ENDPOINTS.SUBSCRIPTIONS.CURRENT);
    return response.data;
  }

  async getAvailablePlans(): Promise<ApiResponse<SubscriptionPlanDetails[]>> {
    const response = await apiService.get<ApiResponse<SubscriptionPlanDetails[]>>(API_ENDPOINTS.SUBSCRIPTIONS.PLANS);
    return response.data;
  }

  async upgradeSubscription(planId: string): Promise<ApiResponse<Subscription>> {
    const response = await apiService.post<ApiResponse<Subscription>>(API_ENDPOINTS.SUBSCRIPTIONS.UPGRADE, { planId });
    return response.data;
  }

  async cancelSubscription(reason?: string): Promise<ApiResponse<Subscription>> {
    const response = await apiService.post<ApiResponse<Subscription>>(API_ENDPOINTS.SUBSCRIPTIONS.CANCEL, { reason });
    return response.data;
  }

  async getUsageStats(): Promise<ApiResponse<SubscriptionUsage>> {
    const response = await apiService.get<ApiResponse<SubscriptionUsage>>(API_ENDPOINTS.SUBSCRIPTIONS.USAGE);
    return response.data;
  }

  async getBillingHistory(): Promise<ApiResponse<any[]>> {
    const response = await apiService.get<ApiResponse<any[]>>('/subscriptions/billing-history');
    return response.data;
  }

  async updateBillingInfo(billingData: any): Promise<ApiResponse<any>> {
    const response = await apiService.put<ApiResponse<any>>('/subscriptions/billing-info', billingData);
    return response.data;
  }

  async getInvoice(invoiceId: string): Promise<Blob> {
    const response = await apiService.get(`/subscriptions/invoices/${invoiceId}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async downloadInvoice(invoiceId: string): Promise<string> {
    const response = await apiService.downloadFile(`/subscriptions/invoices/${invoiceId}/download`);
    return response;
  }
}

export const subscriptionsService = new SubscriptionsService();
