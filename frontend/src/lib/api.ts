const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
import { toast } from 'sonner';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    showToast: boolean = true
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'An error occurred' }));
        const errorMessage = error.error || error.message || 'An error occurred';
        console.error('API Error:', error, 'Status:', response.status);
        if (showToast) {
          toast.error(errorMessage);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (showToast && options.method && options.method !== 'GET') {
        toast.success('Operation successful');
      }
      return data;
    } catch (error: any) {
      console.error('Fetch Error:', error);
      if (showToast && !error.message) {
        toast.error('An error occurred');
      }
      throw error;
    }
  }

  // Auth endpoints
  async register(data: {
    name: string;
    email: string;
    password: string;
    phoneNumber: string;
    businessName?: string;
    businessType?: string;
  }) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(email: string, password: string) {
    const response = await this.request<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(response.token);
    return response;
  }

  async logout() {
    await this.request('/api/auth/logout', { method: 'POST' });
    this.clearToken();
  }

  async verifyEmail(code: string) {
    return this.request('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async resendVerificationCode(email: string) {
    return this.request('/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async forgotPassword(email: string) {
    return this.request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string) {
    return this.request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  async getProfile() {
    return this.request('/api/auth/profile');
  }

  // Payment endpoints
  async createPayment(data: {
    amount: number;
    currency?: string;
    paymentMethod: string;
    customerId?: string;
    description?: string;
    metadata?: any;
  }) {
    return this.request('/api/payments/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createPaymentLink(data: {
    title: string;
    description?: string;
    amount: number;
    currency?: string;
    expiresAt?: string;
  }) {
    return this.request('/api/payments/links', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPaymentLink(id: string) {
    return this.request(`/api/payments/links/${id}`);
  }

  async refundPayment(transactionId: string, data: { amount?: number; reason?: string }) {
    return this.request(`/api/payments/refund/${transactionId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Transaction endpoints
  async getTransactions(page: number = 1, limit: number = 20, filters?: any) {
    const params: any = { page, limit };
    if (filters) Object.assign(params, filters);
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/transactions${query ? `?${query}` : ''}`, {}, false);
  }

  async getAllTransactions(page: number = 1, limit: number = 100, filters?: any) {
    const params: any = { page, limit };
    if (filters) Object.assign(params, filters);
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/transactions/admin/all${query ? `?${query}` : ''}`, {}, false);
  }

  async getTransaction(id: string) {
    return this.request(`/api/transactions/${id}`);
  }

  async getAnalytics(startDate?: string, endDate?: string) {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/transactions/analytics${query ? `?${query}` : ''}`, {}, false);
  }

  // Merchant endpoints
  async getMerchantProfile() {
    return this.request('/api/merchants/profile');
  }

  async updateMerchantProfile(data: {
    businessName?: string;
    businessType?: string;
    businessAddress?: string;
    phoneNumber?: string;
    webhookUrl?: string;
    kycTier?: string;
  }) {
    return this.request('/api/merchants/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async regenerateApiKey(keyId: string) {
    return this.request(`/api/api-keys/${keyId}/regenerate`, { method: 'POST' });
  }

  async getApiKeys() {
    return this.request('/api/api-keys');
  }

  async createApiKey(name: string) {
    return this.request('/api/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async revokeApiKey(keyId: string) {
    return this.request(`/api/api-keys/${keyId}/revoke`, { method: 'POST' });
  }

  async deleteApiKey(keyId: string) {
    return this.request(`/api/api-keys/${keyId}`, { method: 'DELETE' });
  }

  async getBalance() {
    return this.request('/api/merchants/balance');
  }

  async getSettlements(params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/api/merchants/settlements${query ? `?${query}` : ''}`);
  }

  async requestWithdrawal(data: {
    amount: number;
    bankName: string;
    accountNumber: string;
    accountName: string;
  }) {
    return this.request('/api/merchants/withdrawals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getWithdrawals(params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/api/merchants/withdrawals${query ? `?${query}` : ''}`);
  }

  // KYC endpoints
  async uploadKYCDocument(formData: FormData) {
    const url = `${this.baseUrl}/api/kyc/documents`;
    const headers: Record<string, string> = {};

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'An error occurred' }));
        throw new Error(error.error || error.message || 'An error occurred');
      }

      return response.json();
    } catch (error) {
      console.error('Fetch Error:', error);
      throw error;
    }
  }

  async getKYCDocuments() {
    return this.request('/api/kyc/documents');
  }

  async getPendingKYC() {
    return this.request('/api/kyc/pending');
  }

  async approveKYC(documentId: string) {
    return this.request(`/api/kyc/approve/${documentId}`, { method: 'POST' });
  }

  async rejectKYC(documentId: string, reason: string) {
    return this.request(`/api/kyc/reject/${documentId}`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Admin endpoints
  async getDashboardStats() {
    return this.request('/api/admin/dashboard');
  }

  async getMerchants(params?: { page?: number; limit?: number; status?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/api/admin/merchants${query ? `?${query}` : ''}`);
  }

  async approveMerchant(merchantId: string) {
    return this.request(`/api/admin/merchants/${merchantId}/approve`, { method: 'POST' });
  }

  async rejectMerchant(merchantId: string, reason: string) {
    return this.request(`/api/admin/merchants/${merchantId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async getTransactionsAdmin(params?: { page?: number; limit?: number; status?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/api/admin/transactions${query ? `?${query}` : ''}`);
  }

  async getUsers(params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/api/admin/users${query ? `?${query}` : ''}`);
  }

  async getWithdrawalsAdmin(params?: { page?: number; limit?: number; status?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/api/admin/withdrawals${query ? `?${query}` : ''}`);
  }

  async processWithdrawal(withdrawalId: string, data: { status: string; rejectionReason?: string }) {
    return this.request(`/api/admin/withdrawals/${withdrawalId}/process`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getDisputes(params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/api/admin/disputes${query ? `?${query}` : ''}`);
  }

  async getFraudAlerts(params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/api/admin/fraud-alerts${query ? `?${query}` : ''}`);
  }

  // Customer endpoints
  async getCustomerProfile() {
    return this.request('/api/customers/profile');
  }

  async updateCustomerProfile(data: {
    name?: string;
    phone?: string;
    address?: string;
  }) {
    return this.request('/api/customers/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getCustomerAnalytics(startDate?: string, endDate?: string) {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/customers/analytics${query ? `?${query}` : ''}`, {}, false);
  }

  async getCustomerPayments(params?: { page?: number; limit?: number; status?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/api/customers/payments${query ? `?${query}` : ''}`);
  }

  async getCustomerTransfers(params?: { page?: number; limit?: number; status?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/api/customers/transfers${query ? `?${query}` : ''}`);
  }

  async createTransfer(data: {
    receiverEmail: string;
    amount: number;
    description?: string;
  }) {
    return this.request('/api/customers/transfers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async reverseTransfer(transferId: string, reason: string) {
    return this.request(`/api/customers/transfers/${transferId}/reverse`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async getPaymentMethods() {
    return this.request('/api/customers/payment-methods');
  }

  async addPaymentMethod(data: {
    type: string;
    phoneNumber: string;
  }) {
    return this.request('/api/customers/payment-methods', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deletePaymentMethod(methodId: string) {
    return this.request(`/api/customers/payment-methods/${methodId}`, { method: 'DELETE' });
  }

  async setDefaultPaymentMethod(methodId: string) {
    return this.request(`/api/customers/payment-methods/${methodId}/default`, { method: 'POST' });
  }

  async getCustomerDisputes(params?: { page?: number; limit?: number; status?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/api/customers/disputes${query ? `?${query}` : ''}`);
  }

  async createDispute(data: {
    transactionId?: string;
    transferId?: string;
    title: string;
    description: string;
  }) {
    return this.request('/api/customers/disputes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSupportTickets(params?: { page?: number; limit?: number; status?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/api/customers/support-tickets${query ? `?${query}` : ''}`);
  }

  async createSupportTicket(data: {
    subject: string;
    message: string;
    priority?: string;
  }) {
    return this.request('/api/customers/support-tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCustomers(params?: { page?: number; limit?: number; search?: string }) {
    const query = new URLSearchParams(params as any).toString();
    const response = await this.request(`/api/customers${query ? `?${query}` : ''}`);
    // Backend returns { customers: [...], pagination: {...} }
    return (response as any).customers || response;
  }

  async getCustomerKYCDocuments() {
    return this.request('/api/customer-kyc/documents');
  }

  async uploadCustomerKYCDocument(formData: FormData) {
    const url = `${this.baseUrl}/api/customer-kyc/documents`;
    const headers: Record<string, string> = {};

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'An error occurred' }));
        throw new Error(error.error || error.message || 'An error occurred');
      }

      return response.json();
    } catch (error) {
      console.error('Fetch Error:', error);
      throw error;
    }
  }

  async getPaymentLinks(params?: { page?: number; limit?: number; status?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/api/payments/links${query ? `?${query}` : ''}`);
  }

  // Webhook endpoints
  async getWebhooks() {
    return this.request('/api/webhooks');
  }

  async createWebhook(data: { url: string; events: string[]; description?: string }) {
    return this.request('/api/webhooks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async toggleWebhookStatus(webhookId: string) {
    return this.request(`/api/webhooks/${webhookId}/toggle`, { method: 'POST' });
  }

  async deleteWebhook(webhookId: string) {
    return this.request(`/api/webhooks/${webhookId}`, { method: 'DELETE' });
  }

  async getWebhookSecret(webhookId: string) {
    return this.request(`/api/webhooks/${webhookId}/secret`);
  }

  // Notifications endpoints
  async getNotifications(params?: { page?: number; limit?: number; unreadOnly?: boolean }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/api/notifications${query ? `?${query}` : ''}`);
  }

  async markNotificationAsRead(notificationId: string) {
    return this.request(`/api/notifications/${notificationId}/read`, { method: 'POST' });
  }

  async markAllNotificationsAsRead() {
    return this.request('/api/notifications/read-all', { method: 'POST' });
  }

  async deleteNotification(notificationId: string) {
    return this.request(`/api/notifications/${notificationId}`, { method: 'DELETE' });
  }
}

export const api = new ApiClient(API_URL);
