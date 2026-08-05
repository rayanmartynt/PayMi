'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Activity, TrendingUp, Zap, Clock, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function AdminAPIUsagePage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Simulate loading - in production, this would fetch real API usage data
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
        <h1 className="text-3xl font-bold">API Usage</h1>
        <p className="text-muted-foreground">Monitor API performance and usage patterns</p>
      </div>

      <Card>
        <CardContent className="p-8 text-center">
          <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">API Analytics Coming Soon</h3>
          <p className="text-muted-foreground">
            API usage monitoring and analytics will be available once backend logging is implemented.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
