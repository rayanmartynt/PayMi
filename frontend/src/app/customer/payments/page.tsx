'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Search, Download, Filter, ArrowUpRight, ArrowDownRight, CheckCircle, XCircle, Clock } from 'lucide-react'
import { api } from '@/lib/api'
import ProtectedRoute from '@/components/ProtectedRoute'
import { formatCurrency } from '@/lib/utils'

export default function CustomerPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    loadPayments()
  }, [statusFilter])

  const loadPayments = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (statusFilter) params.status = statusFilter
      
      const response = await api.getCustomerPayments(params)
      setPayments(response.payments || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load payments')
    } finally {
      setLoading(false)
    }
  }

  const filteredPayments = payments.filter(payment =>
    payment.merchant?.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.reference?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESSFUL':
        return <Badge variant="success">Successful</Badge>
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>
      case 'PENDING':
        return <Badge variant="warning">Pending</Badge>
      case 'PROCESSING':
        return <Badge variant="default">Processing</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESSFUL':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'FAILED':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'PENDING':
      case 'PROCESSING':
        return <Clock className="h-5 w-5 text-yellow-500" />
      default:
        return null
    }
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Payment History</h1>
          <p className="text-muted-foreground">View all your payment transactions</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Transactions</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search payments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md bg-background"
                >
                  <option value="">All Status</option>
                  <option value="SUCCESSFUL">Successful</option>
                  <option value="FAILED">Failed</option>
                  <option value="PENDING">Pending</option>
                  <option value="PROCESSING">Processing</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">{error}</div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No payments found
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-red-100">
                        <ArrowUpRight className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium">{payment.merchant?.businessName || 'Unknown Merchant'}</p>
                        <p className="text-sm text-muted-foreground">
                          {payment.reference} • {new Date(payment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-red-600">
                          -{formatCurrency(payment.amount)}
                        </p>
                        {getStatusBadge(payment.status)}
                      </div>
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
