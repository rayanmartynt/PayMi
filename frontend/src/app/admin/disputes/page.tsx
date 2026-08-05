'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { AlertTriangle, CheckCircle, Clock, MessageSquare, Loader2 } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import { useState, useEffect } from 'react'

interface Dispute {
  id: string
  transactionId: string
  merchantName: string
  customerName: string
  amount: number
  reason: string
  status: 'open' | 'investigating' | 'resolved'
  createdAt: Date
  resolvedAt?: Date
  resolution?: string
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null)

  useEffect(() => {
    // Simulate loading - in production, this would fetch real dispute data
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
        <h1 className="text-3xl font-bold">Disputes</h1>
        <p className="text-muted-foreground">Manage payment disputes and chargebacks</p>
      </div>

      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Dispute Management Coming Soon</h3>
          <p className="text-muted-foreground">
            Dispute tracking and management will be available once the dispute system is implemented.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
