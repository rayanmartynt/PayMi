const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
import { toast } from 'sonner';

class ApiClient {
  deleteWebhook(id: string) {
    throw new Error('Method not implemented.');
  }
  toggleWebhookStatus(id: string) {
    throw new Error('Method not implemented.');
  }
  createWebhook(arg0: { url: string; events: string[]; }) {
    throw new Error('Method not implemented.');
  }
  getWebhooks() {
    throw new Error('Method not implemented.');
  }
  private baseUrl: string;
  private token: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing: boolean = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
      this.refreshToken = localStorage.getItem('refreshToken');
    }
  }

  setToken(token: string, refreshToken?: string) {
    this.token = token;
    if (refreshToken) {
      this.refreshToken = refreshToken;
      if (typeof window !== 'undefined') {
        localStorage.setItem('refreshToken', refreshToken);
      }
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  clearToken() {
    this.token = null;
    this.refreshToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
  }

  private async refreshTokenRequest(): Promise<string> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: this.refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    this.setToken(data.token, data.refreshToken);
    return data.token;
  }

  private subscribeTokenRefresh(callback: (token: string) => void) {
    this.refreshSubscribers.push(callback);
  }

  private onTokenRefreshed(token: string) {
    this.refreshSubscribers.forEach(callback => callback(token));
    this.refreshSubscribers = [];
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
        if (response.status === 401 && this.refreshToken && !this.isRefreshing) {
          this.isRefreshing = true;
          try {
            const newToken = await this.refreshTokenRequest();
            this.isRefreshing = false;
            this.onTokenRefreshed(newToken);
            
            // Retry the original request with new token
            headers['Authorization'] = `Bearer ${newToken}`;
            const retryResponse = await fetch(url, {
              ...options,
              headers,
            });
            
            if (!retryResponse.ok) {
              const error = await retryResponse.json().catch(() => ({ error: 'An error occurred' }));
              const errorMessage = error.error || error.message || 'An error occurred';
              if (showToast) {
                toast.error(errorMessage);
              }
              throw new Error(errorMessage);
            }
            
            const data = await retryResponse.json();
            if (showToast && options.method && options.method !== 'GET') {
              toast.success('Operation successful');
            }
            return data;
          } catch (refreshError) {
            this.isRefreshing = false;
            this.clearToken();
            window.location.href = '/login';
            throw new Error('Session expired. Please log in again.');
          }
        }

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
  async register(data: any) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async initiateRegistration(data: any) {
    return this.request('/api/auth/initiate-registration', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async completeRegistrationPhone(tempToken: string, code: string) {
    return this.request<{ token: string; refreshToken: string; user: { role: string } }>('/api/auth/complete-registration-phone', {
      method: 'POST',
      body: JSON.stringify({ tempToken, code }),
    });
  }

  async completeRegistrationEmail(tempToken: string, code: string) {
    return this.request('/api/auth/complete-registration-email', {
      method: 'POST',
      body: JSON.stringify({ tempToken, code }),
    });
  }

  async login(email: string, password: string) {
    const response = await this.request<{ token: string; refreshToken: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier: email, password }),
    });
    this.setToken(response.token, response.refreshToken);
    return response;
  }

  async logout() {
    await this.request('/api/auth/logout', { method: 'POST' });
    this.clearToken();
  }

  async verifyEmail(code: string, email?: string) {
    return this.request('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ code, email }),
    });
  }

  async resendVerificationCode(email?: string) {
    return this.request('/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify(email ? { email } : {}),
    });
  }

  async resendVerificationCodePublic(tempToken: string) {
    return this.request('/api/auth/resend-verification-public', {
      method: 'POST',
      body: JSON.stringify({ tempToken }),
    });
  }

  // Dashboard verification endpoints
  async sendPhoneVerification(phoneNumber?: string) {
    return this.request('/api/auth/send-phone-verification', {
      method: 'POST',
      body: JSON.stringify(phoneNumber ? { phoneNumber } : {}),
    });
  }

  async verifyPhoneDashboard(code: string) {
    return this.request('/api/auth/verify-phone', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async verifyEmailDashboard(code: string) {
    return this.request('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  // Contacts API
  async syncContacts(contacts: Array<{ name: string; phoneNumber: string }>) {
    return this.request('/api/contacts/sync', {
      method: 'POST',
      body: JSON.stringify({ contacts }),
    });
  }

  async getContacts(onlyPayMiUsers?: boolean) {
    return this.request(`/api/contacts${onlyPayMiUsers ? '?onlyPayMiUsers=true' : ''}`);
  }

  async getPayMiUsers(search?: string) {
    return this.request(`/api/contacts/paymi-users${search ? `?search=${search}` : ''}`);
  }

  async deleteContact(contactId: string) {
    return this.request(`/api/contacts/${contactId}`, {
      method: 'DELETE',
    });
  }

  // Friendships API
  async sendFriendRequest(contactId: string) {
    return this.request('/api/friendships/request', {
      method: 'POST',
      body: JSON.stringify({ contactId }),
    });
  }

  async acceptFriendRequest(friendshipId: string) {
    return this.request(`/api/friendships/accept/${friendshipId}`, {
      method: 'POST',
    });
  }

  async rejectFriendRequest(friendshipId: string) {
    return this.request(`/api/friendships/reject/${friendshipId}`, {
      method: 'POST',
    });
  }

  async getFriendRequests() {
    return this.request('/api/friendships/requests');
  }

  async getFriends() {
    return this.request('/api/friendships');
  }

  async blockFriend(friendshipId: string) {
    return this.request(`/api/friendships/block/${friendshipId}`, {
      method: 'POST',
    });
  }

  // Chats API
  async getChatWithFriend(friendId: string) {
    return this.request(`/api/chats/with/${friendId}`);
  }

  async getChats() {
    return this.request('/api/chats');
  }

  async sendMessage(chatId: string, content: string) {
    return this.request(`/api/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async getMessages(chatId: string, limit?: number, offset?: number) {
    return this.request(`/api/chats/${chatId}/messages?limit=${limit || 50}&offset=${offset || 0}`);
  }

  async markMessagesAsRead(chatId: string) {
    return this.request(`/api/chats/${chatId}/read`, {
      method: 'POST',
    });
  }

  // P2P Transfers API
  async sendToFriend(friendId: string, amount: number, description?: string) {
    return this.request('/api/customers/transfers/friend', {
      method: 'POST',
      body: JSON.stringify({ friendId, amount, description }),
    });
  }

  // Merchant Payments API
  async getMerchantByMerchantId(merchantId: string) {
    return this.request(`/api/merchant-payments/merchant/${merchantId}`);
  }

  async payMerchantByMerchantId(merchantId: string, amount: number, paymentMethod: string, description?: string) {
    return this.request('/api/merchant-payments/pay-by-id', {
      method: 'POST',
      body: JSON.stringify({ merchantId, amount, paymentMethod, description }),
    });
  }

  // Merchant API Keys
  async getApiKeys() {
    return this.request('/api/merchants/api-keys');
  }

  async createApiKey(name: string, permissions?: string[], expiresIn?: number) {
    return this.request('/api/merchants/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name, permissions, expiresIn }),
    });
  }

  async getApiKey(id: string) {
    return this.request(`/api/merchants/api-keys/${id}`);
  }

  async updateApiKey(id: string, name?: string, permissions?: string[], isActive?: boolean) {
    return this.request(`/api/merchants/api-keys/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, permissions, isActive }),
    });
  }

  async deleteApiKey(id: string) {
    return this.request(`/api/merchants/api-keys/${id}`, {
      method: 'DELETE',
    });
  }

  async regenerateApiKeySecret(id: string) {
    return this.request(`/api/merchants/api-keys/${id}/regenerate`, {
      method: 'POST',
    });
  }

  // Merchant Webhooks
  async getMerchantWebhooks() {
    return this.request('/api/merchants/webhooks');
  }

  async createMerchantWebhook(url: string, events?: string[]) {
    return this.request('/api/merchants/webhooks', {
      method: 'POST',
      body: JSON.stringify({ url, events }),
    });
  }

  async getMerchantWebhook(id: string) {
    return this.request(`/api/merchants/webhooks/${id}`);
  }

  async updateMerchantWebhook(id: string, url?: string, events?: string[], isActive?: boolean) {
    return this.request(`/api/merchants/webhooks/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ url, events, isActive }),
    });
  }

  async deleteMerchantWebhook(id: string) {
    return this.request(`/api/merchants/webhooks/${id}`, {
      method: 'DELETE',
    });
  }

  async regenerateMerchantWebhookSecret(id: string) {
    return this.request(`/api/merchants/webhooks/${id}/regenerate`, {
      method: 'POST',
    });
  }

  async testMerchantWebhook(id: string) {
    return this.request(`/api/merchants/webhooks/${id}/test`, {
      method: 'POST',
    });
  }

  // Money Requests
  async createMoneyRequest(receiverId: string, amount: number, description?: string, expiresIn?: number) {
    return this.request('/api/money-requests', {
      method: 'POST',
      body: JSON.stringify({ receiverId, amount, description, expiresIn }),
    });
  }

  async getReceivedMoneyRequests(status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.request(`/api/money-requests/received${query}`);
  }

  async getSentMoneyRequests(status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.request(`/api/money-requests/sent${query}`);
  }

  async acceptMoneyRequest(id: string) {
    return this.request(`/api/money-requests/${id}/accept`, {
      method: 'POST',
    });
  }

  async rejectMoneyRequest(id: string) {
    return this.request(`/api/money-requests/${id}/reject`, {
      method: 'POST',
    });
  }

  async cancelMoneyRequest(id: string) {
    return this.request(`/api/money-requests/${id}/cancel`, {
      method: 'POST',
    });
  }

  async getMoneyRequest(id: string) {
    return this.request(`/api/money-requests/${id}`);
  }

  // Wallet Funding
  async createWalletFunding(amount: number, provider: string, phoneNumber: string) {
    return this.request<{ funding: any }>('/api/wallet-funding', {
      method: 'POST',
      body: JSON.stringify({ amount, provider, phoneNumber }),
    });
  }

  async getWalletFundingHistory(status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.request<{ funding: any[] }>(`/api/wallet-funding${query}`);
  }

  async getWalletFunding(id: string) {
    return this.request(`/api/wallet-funding/${id}`);
  }

  async cancelWalletFunding(id: string) {
    return this.request(`/api/wallet-funding/${id}/cancel`, {
      method: 'POST',
    });
  }

  // Admin fee management
  async getAdminBalance() {
    return this.request('/api/admin/fees/balance');
  }

  async getAdminFeesHistory(type?: string, isCollected?: boolean) {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (isCollected !== undefined) params.append('isCollected', isCollected.toString());
    const query = params.toString();
    return this.request(`/api/admin/fees/history${query ? '?' + query : ''}`);
  }

  async getAdminBankAccounts() {
    return this.request('/api/admin/fees/bank-accounts');
  }

  async addAdminBankAccount(data: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    isDefault?: boolean;
  }) {
    return this.request('/api/admin/fees/bank-accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteAdminBankAccount(id: string) {
    return this.request(`/api/admin/fees/bank-accounts/${id}`, {
      method: 'DELETE',
    });
  }

  async setDefaultAdminBankAccount(id: string) {
    return this.request(`/api/admin/fees/bank-accounts/${id}/default`, {
      method: 'POST',
    });
  }

  async createAdminWithdrawal(data: {
    amount: number;
    bankAccountId: string;
  }) {
    return this.request('/api/admin/fees/withdrawals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAdminWithdrawals(status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.request(`/api/admin/fees/withdrawals${query}`);
  }

  async processAdminWithdrawal(id: string, data: {
    status: 'APPROVED' | 'REJECTED';
    notes?: string;
  }) {
    return this.request(`/api/admin/fees/withdrawals/${id}/process`, {
      method: 'POST',
      body: JSON.stringify(data),
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
    businessEmail?: string;
    phoneNumber?: string;
    businessAddress?: string;
    profilePicture?: string;
  }) {
    return this.request('/api/merchants/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
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

  async getCustomerWithdrawals(params?: { page?: number; limit?: number; status?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ withdrawals: any[] }>(`/api/customers/withdrawals${query ? `?${query}` : ''}`);
  }

  async createCustomerWithdrawal(data: {
    amount: number;
    mobileMoneyProvider: string;
    mobileNumber: string;
  }) {
    return this.request('/api/customers/withdrawals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPaymentLinks(params?: { page?: number; limit?: number; status?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/api/payments/links${query ? `?${query}` : ''}`);
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
