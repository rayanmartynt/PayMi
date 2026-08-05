'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { AlertTriangle, Shield, Eye, Ban, CheckCircle, Activity, Loader2 } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import { useState, useEffect } from 'react'

interface FraudAlert {
  id: string
  type: string
  severity: 'high' | 'medium' | 'low'
  merchantId: string
  merchantName: string
  description: string
  transactionCount: number
  amount: number
  detectedAt: Date
  status: 'open' | 'investigating' | 'resolved'
  resolvedAt?: Date
  resolution?: string
}

export default function AdminFraudPage() {
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null)

  useEffect(() => {
    // Simulate loading - in production, this would fetch real fraud alert data
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
        <h1 className="text-3xl font-bold">Fraud Monitoring</h1>
        <p className="text-muted-foreground">Detect and prevent fraudulent activities</p>
      </div>

      <Card>
        <CardContent className="p-8 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Fraud Detection Coming Soon</h3>
          <p className="text-muted-foreground">
            Fraud monitoring and alert system will be available once fraud detection is implemented.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
