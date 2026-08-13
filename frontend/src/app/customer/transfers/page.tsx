'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Search, ArrowUpRight, ArrowDownRight, CheckCircle, XCircle, Clock, RotateCcw } from 'lucide-react'
import { api } from '@/lib/api'
import ProtectedRoute from '@/components/ProtectedRoute'
import { formatCurrency } from '@/lib/utils'

export default function CustomerTransfersPage() {
  const [transfers, setTransfers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [reversingId, setReversingId] = useState<string | null>(null)

  useEffect(() => {
    loadTransfers()
  }, [statusFilter])

  const loadTransfers = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (statusFilter) params.status = statusFilter
      
      const response = await api.getCustomerTransfers(params) as any
      setTransfers(response.transfers || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load transfers')
    } finally {
      setLoading(false)
    }
  }

  const handleReverse = async (transferId: string) => {
    const reason = prompt('Please provide a reason for reversing this transfer:')
    if (!reason) return

    try {
      setReversingId(transferId)
      await api.reverseTransfer(transferId, reason)
      loadTransfers()
    } catch (err: any) {
      alert(err.message || 'Failed to reverse transfer')
    } finally {
      setReversingId(null)
    }
  }

  const filteredTransfers = transfers.filter(transfer =>
    transfer.sender?.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transfer.receiver?.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transfer.reference?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>
      case 'PENDING':
        return <Badge variant="warning">Pending</Badge>
      case 'REVERSED':
        return <Badge variant="outline">Reversed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Transfers</h1>
          <p className="text-muted-foreground">View your transfer history and reverse completed transfers</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Transfer History</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search transfers..."
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
                  <option value="COMPLETED">Completed</option>
                  <option value="FAILED">Failed</option>
                  <option value="PENDING">Pending</option>
                  <option value="REVERSED">Reversed</option>
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
            ) : filteredTransfers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No transfers found
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTransfers.map((transfer) => {
                  const isSent = transfer.sender?.user?.email === transfer.sender?.user?.email
                  const isReversible = transfer.status === 'COMPLETED' && isSent
                  
                  return (
                    <div
                      key={transfer.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`flex items-center justify-center h-10 w-10 rounded-full ${
                          isSent ? 'bg-red-100' : 'bg-green-100'
                        }`}>
                          {isSent ? (
                            <ArrowUpRight className="h-5 w-5 text-red-600" />
                          ) : (
                            <ArrowDownRight className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {isSent 
                              ? `To: ${transfer.receiver?.user?.email}` 
                              : `From: ${transfer.sender?.user?.email}`
                            }
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {transfer.reference} • {new Date(transfer.createdAt).toLocaleDateString()}
                          </p>
                          {transfer.description && (
                            <p className="text-sm text-muted-foreground">{transfer.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`font-semibold ${isSent ? 'text-red-600' : 'text-green-600'}`}>
                            {isSent ? '-' : '+'}{formatCurrency(transfer.amount)}
                          </p>
                          {getStatusBadge(transfer.status)}
                        </div>
                        {isReversible && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleReverse(transfer.id)}
                            disabled={reversingId === transfer.id}
                            title="Reverse transfer"
                          >
                            <RotateCcw className={`h-4 w-4 ${reversingId === transfer.id ? 'animate-spin' : ''}`} />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
