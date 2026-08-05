export type PaymentMethod = 'orange_money' | 'afrimoney' | 'qmoney'

export type PaymentStatus = 'pending' | 'successful' | 'failed' | 'refunded'

export type KYCStatus = 'pending' | 'approved' | 'rejected'

export type UserRole = 'merchant' | 'customer' | 'admin'

export interface User {
  id: string
  email: string
  name: string
  phone?: string
  role: UserRole
  createdAt: Date
  verified: boolean
}

export interface Merchant extends User {
  businessName: string
  businessType: string
  kycStatus: KYCStatus
  kycDocuments?: KYCDocument[]
  balance: number
  pendingBalance: number
  totalSettled: number
  apiKeys?: APIKey[]
}

export interface Customer extends User {
  lifetimeValue: number
  totalPayments: number
}

export interface KYCDocument {
  id: string
  type: 'national_id' | 'passport' | 'drivers_license' | 'business_certificate'
  documentUrl: string
  status: KYCStatus
  submittedAt: Date
  reviewedAt?: Date
  rejectionReason?: string
}

export interface APIKey {
  id: string
  name: string
  publicKey: string
  secretKey: string
  webhookSecret: string
  createdAt: Date
  lastUsed?: Date
  isActive: boolean
}

export interface Transaction {
  id: string
  merchantId: string
  customerId?: string
  amount: number
  currency: string
  status: PaymentStatus
  paymentMethod: PaymentMethod
  description?: string
  customerEmail?: string
  customerPhone?: string
  customerName?: string
  createdAt: Date
  completedAt?: Date
  refundedAt?: Date
  refundReason?: string
  metadata?: Record<string, any>
}

export interface PaymentLink {
  id: string
  merchantId: string
  amount: number
  currency: string
  description?: string
  url: string
  qrCode?: string
  isActive: boolean
  createdAt: Date
  expiresAt?: Date
}

export interface Settlement {
  id: string
  merchantId: string
  amount: number
  currency: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  mobileMoneyProvider: string
  mobileNumber: string
  createdAt: Date
  processedAt?: Date
}

export interface Dispute {
  id: string
  transactionId: string
  reason: string
  status: 'open' | 'investigating' | 'resolved' | 'closed'
  createdAt: Date
  resolvedAt?: Date
  resolution?: string
}

export interface Notification {
  id: string
  userId: string
  type: 'payment_received' | 'settlement_completed' | 'refund_successful' | 'payment_failed' | 'kyc_approved' | 'kyc_rejected'
  title: string
  message: string
  read: boolean
  createdAt: Date
}

export interface Analytics {
  revenue: number
  transactions: number
  successRate: number
  averageTransactionValue: number
  dailyRevenue: { date: string; amount: number }[]
  paymentMethods: { method: PaymentMethod; count: number; amount: number }[]
  customerGrowth: { date: string; customers: number }[]
}
