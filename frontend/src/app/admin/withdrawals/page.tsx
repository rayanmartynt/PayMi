'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Wallet, CheckCircle, XCircle, Clock, Building2, Loader2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import { useState, useEffect } from 'react'

interface Withdrawal {
  id: string
  merchantId: string
  merchantName: string
  amount: number
  bankName: string
  accountNumber: string
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  requestedAt: Date
  processedAt?: Date
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null)

  useEffect(() => {
    // Simulate loading - in production, this would fetch real withdrawal data
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Withdrawals</h1>
        <p className="text-muted-foreground">Process merchant withdrawal requests</p>
      </div>

      <Card>
        <CardContent className="p-8 text-center">
          <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Withdrawal Management Coming Soon</h3>
          <p className="text-muted-foreground">
            Withdrawal processing and management will be available once the withdrawal system is implemented.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
