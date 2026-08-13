'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Users, Wallet, AlertTriangle, Activity, ShieldCheck, Loader2, Building2, Mail, Calendar } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'

interface DashboardStats {
  totalMerchants: number
  activeMerchants: number
  totalTransactions: number
  totalVolume: number
  pendingWithdrawals: number
  pendingKYC: number
  activeDisputes: number
  fraudAlerts: number
}

interface Merchant {
  id: string
  businessName: string
  businessType: string
  email: string
  kycStatus: string
  verified: boolean
  createdAt: Date
}

export default function AdminPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
    // Poll for updates every 30 seconds
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      const [statsData, merchantsData] = await Promise.all([
        api.getDashboardStats().catch(() => null),
        api.getUsers().catch(() => [])
      ])
      
      if (statsData) {
        setStats(statsData as any)
      }
      
      // Filter only merchants from users
      const users = Array.isArray(merchantsData) ? merchantsData : (merchantsData as any).users || []
      setMerchants(users.filter((u: any) => u.role === 'MERCHANT'))
      
      setError('')
    } catch (err: any) {
      // If unauthorized, redirect to login
      if (err.message?.includes('Admin access required') || err.message?.includes('403')) {
        router.push('/dashboard')
        return
      }
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-8">
        Error loading data: {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform overview and management</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Merchants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{merchants.length.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {merchants.filter(m => m.verified).length} verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTransactions?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(stats?.totalVolume || 0)} volume
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending KYC</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{merchants.filter(m => m.kycStatus === 'PENDING').length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Requires review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Disputes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeDisputes || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.fraudAlerts || 0} fraud alerts
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Registered Merchants ({merchants.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {merchants.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No merchants registered yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium text-sm">Business Name</th>
                    <th className="text-left p-4 font-medium text-sm">Business Type</th>
                    <th className="text-left p-4 font-medium text-sm">Email</th>
                    <th className="text-left p-4 font-medium text-sm">KYC Status</th>
                    <th className="text-left p-4 font-medium text-sm">Verified</th>
                    <th className="text-left p-4 font-medium text-sm">Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {merchants.map((merchant) => (
                    <tr key={merchant.id} className="border-b hover:bg-muted/50">
                      <td className="p-4 font-medium">{merchant.businessName}</td>
                      <td className="p-4 text-sm">{merchant.businessType}</td>
                      <td className="p-4 text-sm flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {merchant.email}
                      </td>
                      <td className="p-4">
                        <Badge variant={
                          merchant.kycStatus === 'APPROVED' ? 'success' :
                          merchant.kycStatus === 'PENDING' ? 'warning' :
                          merchant.kycStatus === 'UNDER_REVIEW' ? 'secondary' :
                          'destructive'
                        }>
                          {merchant.kycStatus}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant={merchant.verified ? 'success' : 'destructive'}>
                          {merchant.verified ? 'Yes' : 'No'}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(merchant.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
