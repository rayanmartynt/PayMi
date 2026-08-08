'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Wallet, Plus, CheckCircle, XCircle, Clock, AlertCircle, Phone, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import ProtectedRoute from '@/components/ProtectedRoute'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

const PROVIDERS = [
  { id: 'ORANGE_MONEY', name: 'Orange Money', color: 'from-orange-500 to-orange-600', icon: '🍊' },
  { id: 'QMONEY', name: 'QMoney', color: 'from-purple-500 to-purple-600', icon: '💜' },
  { id: 'AFRI_MONEY', name: 'Afri Money', color: 'from-green-500 to-green-600', icon: '💚' },
]

export default function AddFundsPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<any[]>([])
  const [selectedProvider, setSelectedProvider] = useState('')
  const [formData, setFormData] = useState({
    amount: '',
    phoneNumber: ''
  })
  const [creating, setCreating] = useState(false)
  const [createdRequest, setCreatedRequest] = useState<any>(null)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      const data = await api.getWalletFundingHistory()
      setHistory(data.funding || [])
    } catch (err: any) {
      console.error('Failed to load funding history:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setCreating(true)

    try {
      const amount = parseFloat(formData.amount)
      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid amount')
        setCreating(false)
        return
      }

      if (!selectedProvider) {
        setError('Please select a provider')
        setCreating(false)
        return
      }

      if (!formData.phoneNumber) {
        setError('Please enter your phone number')
        setCreating(false)
        return
      }

      const result = await api.createWalletFunding(amount, selectedProvider, formData.phoneNumber)
      setCreatedRequest(result.funding)
      setFormData({ amount: '', phoneNumber: '' })
      setSelectedProvider('')
      loadHistory()
      toast.success('Funding request created successfully')
    } catch (err: any) {
      setError(err.message || 'Failed to create funding request')
    } finally {
      setCreating(false)
    }
  }

  const handleCancelRequest = async (requestId: string) => {
    try {
      await api.cancelWalletFunding(requestId)
      toast.success('Funding request cancelled')
      loadHistory()
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel request')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="warning"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'COMPLETED':
        return <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>
      case 'FAILED':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Add Funds</h1>
          <p className="text-muted-foreground">Add money to your wallet using mobile money services</p>
        </div>

        {createdRequest && (
          <Card className="border-green-500 bg-green-50 dark:bg-green-900/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-600 dark:text-green-400 mb-2">Funding Request Created</h3>
                  <p className="text-sm text-green-600 dark:text-green-400 mb-4">
                    Your funding request has been created. You will receive a confirmation SMS from your provider to complete the payment.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Amount:</span>
                      <span className="font-medium">{formatCurrency(parseFloat(createdRequest.amount))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Provider:</span>
                      <span className="font-medium">{PROVIDERS.find(p => p.id === createdRequest.provider)?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Reference:</span>
                      <span className="font-medium font-mono">{createdRequest.reference}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-4"
                    onClick={() => setCreatedRequest(null)}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Add Funds Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Add Funds
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Provider *</label>
                  <div className="grid gap-2">
                    {PROVIDERS.map((provider) => (
                      <button
                        key={provider.id}
                        type="button"
                        onClick={() => setSelectedProvider(provider.id)}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          selectedProvider === provider.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{provider.icon}</span>
                          <div>
                            <p className="font-medium">{provider.name}</p>
                            <p className="text-xs text-muted-foreground">Mobile Money Service</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount (SLE) *</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    disabled={creating}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      placeholder="+232 XX XXX XXX"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="pl-10"
                      required
                      disabled={creating}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter the phone number registered with your mobile money provider
                  </p>
                </div>

                <Button
                  type="submit"
                  variant="gradient"
                  className="w-full"
                  disabled={creating || !selectedProvider}
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Request...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Funds
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Funding History */}
          <Card>
            <CardHeader>
              <CardTitle>Funding History</CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No funding history yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {history.map((funding) => (
                    <div key={funding.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${PROVIDERS.find(p => p.id === funding.provider)?.color} flex items-center justify-center text-white text-lg`}>
                            {PROVIDERS.find(p => p.id === funding.provider)?.icon}
                          </div>
                          <div>
                            <p className="font-medium">{PROVIDERS.find(p => p.id === funding.provider)?.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(funding.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{formatCurrency(parseFloat(funding.amount))}</p>
                          {getStatusBadge(funding.status)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Ref: {funding.reference}</span>
                        {funding.status === 'PENDING' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCancelRequest(funding.id)}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Select your mobile money provider (Orange Money, QMoney, or Afri Money)</li>
              <li>Enter the amount you want to add to your wallet</li>
              <li>Enter the phone number registered with your provider</li>
              <li>Submit your request and wait for the confirmation SMS</li>
              <li>Follow the instructions in the SMS to complete the payment</li>
              <li>Once confirmed, the funds will be added to your wallet automatically</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
