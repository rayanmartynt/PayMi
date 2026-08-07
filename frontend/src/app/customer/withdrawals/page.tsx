'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrowUpRight, Wallet, CheckCircle, XCircle, Clock } from 'lucide-react'
import { api } from '@/lib/api'
import ProtectedRoute from '@/components/ProtectedRoute'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'

export default function CustomerWithdrawalsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [amount, setAmount] = useState('')
  const [mobileNumber, setMobileNumber] = useState('')
  const [mobileMoneyProvider, setMobileMoneyProvider] = useState('ORANGE_MONEY')
  const [submitting, setSubmitting] = useState(false)
  const [fee, setFee] = useState(0)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    const amountValue = parseFloat(amount) || 0
    setFee(amountValue * 0.03) // 3% fee for customer withdrawals
  }, [amount])

  const fetchData = async () => {
    try {
      const [profile, withdrawals] = await Promise.all([
        api.getCustomerProfile(),
        api.getCustomerWithdrawals()
      ])
      setData({ profile, withdrawals: withdrawals.withdrawals || [] })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await api.createCustomerWithdrawal({
        amount: parseFloat(amount),
        mobileMoneyProvider,
        mobileNumber
      })
      setAmount('')
      setMobileNumber('')
      await fetchData()
    } catch (err: any) {
      setError(err.message || 'Failed to create withdrawal request')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESSFUL':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'FAILED':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESSFUL':
        return <Badge variant="success">Successful</Badge>
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="warning">Pending</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error && !data) return <div className="text-red-500">Error: {error}</div>
  if (!data) return null

  const { profile, withdrawals } = data

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Withdraw Funds</h1>
          <p className="text-muted-foreground">Withdraw your balance to your mobile money account</p>
        </div>

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

        {/* Withdrawal Form */}
        <Card>
          <CardHeader>
            <CardTitle>Request Withdrawal</CardTitle>
            <CardDescription>Enter withdrawal details below</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Amount (SLE)</label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  min="1"
                  step="0.01"
                  max={profile.balance}
                />
                <p className="text-xs text-muted-foreground">Available: {formatCurrency(profile.balance)}</p>
                {fee > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Fee (3%):</span>
                    <span className="text-orange-600 font-medium">{formatCurrency(fee)}</span>
                  </div>
                )}
                {fee > 0 && (
                  <div className="flex justify-between text-xs font-medium">
                    <span>Total:</span>
                    <span>{formatCurrency(parseFloat(amount || '0') + fee)}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Mobile Money Provider</label>
                <select
                  value={mobileMoneyProvider}
                  onChange={(e) => setMobileMoneyProvider(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  required
                >
                  <option value="ORANGE_MONEY">Orange Money</option>
                  <option value="AFRIMONEY">Afrimoney</option>
                  <option value="QMONEY">Q-Money</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Mobile Number</label>
                <Input
                  type="tel"
                  placeholder="+232 XX XXX XXX"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" variant="gradient" className="w-full" disabled={submitting}>
                {submitting ? 'Processing...' : 'Request Withdrawal'}
                {!submitting && <ArrowUpRight className="h-4 w-4 ml-2" />}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Withdrawal History */}
        <Card>
          <CardHeader>
            <CardTitle>Withdrawal History</CardTitle>
          </CardHeader>
          <CardContent>
            {withdrawals.length > 0 ? (
              <div className="space-y-4">
                {withdrawals.map((withdrawal: any) => (
                  <div key={withdrawal.id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Wallet className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{withdrawal.mobileMoneyProvider}</p>
                        <p className="text-sm text-muted-foreground">{withdrawal.mobileNumber}</p>
                        <p className="text-xs text-muted-foreground">{new Date(withdrawal.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">-{formatCurrency(withdrawal.amount)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusIcon(withdrawal.status)}
                        {getStatusBadge(withdrawal.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No withdrawal history</p>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
