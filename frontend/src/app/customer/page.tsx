'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ArrowUpRight, ArrowDownRight, TrendingUp, Wallet, Send, History, ArrowLeftRight, AlertCircle, Shield } from 'lucide-react'
import { api } from '@/lib/api'
import ProtectedRoute from '@/components/ProtectedRoute'
import { formatCurrency } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

export default function CustomerDashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [kycStatus, setKycStatus] = useState<string>('PENDING')

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch customer profile and analytics
        const profile = await api.getCustomerProfile()
        const analytics = await api.getCustomerAnalytics()
        
        setData({ profile, analytics })
        setKycStatus((profile as any).kycStatus || 'PENDING')
      } catch (err) {
        console.error('Failed to fetch dashboard data', err)
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) return <div className="text-red-500">Error loading data: {error}</div>
  if (!data) return null

  const { profile, analytics } = data

  const quickActions = [
    {
      icon: Send,
      label: 'Send Money',
      description: 'Transfer to another customer',
      href: '/customer/transfer',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: History,
      label: 'Payment History',
      description: 'View all your transactions',
      href: '/customer/payments',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: ArrowLeftRight,
      label: 'Transfers',
      description: 'View transfer history',
      href: '/customer/transfers',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: Wallet,
      label: 'Payment Methods',
      description: 'Manage payment options',
      href: '/customer/payment-methods',
      color: 'from-orange-500 to-orange-600'
    },
    {
      icon: ArrowUpRight,
      label: 'Withdraw',
      description: 'Withdraw funds',
      href: '/customer/withdrawals',
      color: 'from-pink-500 to-pink-600'
    }
  ]

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {profile.name}</h1>
          <p className="text-muted-foreground">Manage your payments and transfers</p>
        </div>

        {/* KYC Banner */}
        {kycStatus !== 'APPROVED' && (
          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                  <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                    KYC Verification Required
                  </h3>
                  <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                    Complete your identity verification to unlock transfers, withdrawals, and receiving money.
                  </p>
                  <Button
                    onClick={() => router.push('/customer/kyc')}
                    variant="gradient"
                    size="sm"
                  >
                    Complete Verification
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Balance Card */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
          <CardHeader>
            <CardTitle className="text-white">Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-2">{formatCurrency(profile.balance)}</div>
            <p className="text-blue-100">SLE - Sierra Leone Leone</p>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics.totalSpent || 0)}</div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalTransactions || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transfers</CardTitle>
              <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalTransfers || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.href}
                  onClick={() => router.push(action.href)}
                  className="relative overflow-hidden rounded-lg border bg-card p-6 text-left transition-all hover:shadow-md hover:border-primary/50"
                >
                  <div className={`absolute top-0 right-0 h-16 w-16 bg-gradient-to-br ${action.color} opacity-10 rounded-bl-full`} />
                  <Icon className="h-8 w-8 mb-3 text-primary" />
                  <h3 className="font-semibold mb-1">{action.label}</h3>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.recentTransactions && analytics.recentTransactions.length > 0 ? (
              <div className="space-y-4">
                {analytics.recentTransactions.slice(0, 5).map((transaction: any) => (
                  <div key={transaction.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'received' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {transaction.type === 'received' ? (
                          <ArrowDownRight className="h-5 w-5 text-green-600" />
                        ) : (
                          <ArrowUpRight className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description || transaction.merchantName || 'Payment'}</p>
                        <p className="text-sm text-muted-foreground">{new Date(transaction.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${transaction.type === 'received' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'received' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </p>
                      <Badge variant={transaction.status === 'completed' ? 'success' : 'warning'}>
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No recent activity</p>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
