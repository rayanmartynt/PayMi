'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Store, CheckCircle, AlertCircle, Search } from 'lucide-react'
import { api } from '@/lib/api'
import ProtectedRoute from '@/components/ProtectedRoute'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

export default function PayMerchantPage() {
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [merchantId, setMerchantId] = useState('')
  const [merchantInfo, setMerchantInfo] = useState<any>(null)
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'mobile_money',
    description: ''
  })
  const [paymentResult, setPaymentResult] = useState<any>(null)
  const [fee, setFee] = useState(0)

  // Calculate fee when amount changes
  const calculateFee = (amount: number) => {
    return amount * 0.02 // 2% fee for merchant payments
  }

  const handleSearchMerchant = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMerchantInfo(null)
    setSearching(true)

    try {
      const info = await api.getMerchantByMerchantId(merchantId)
      setMerchantInfo(info)
      setFormData(prev => ({ ...prev, amount: '', description: '' }))
    } catch (err: any) {
      setError(err.message || 'Merchant not found')
    } finally {
      setSearching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      const amount = parseFloat(formData.amount)
      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid amount')
        setLoading(false)
        return
      }

      const result = await api.payMerchantByMerchantId(
        merchantId.toUpperCase(),
        amount,
        formData.paymentMethod,
        formData.description
      )

      setPaymentResult(result)
      setSuccess(true)
      setMerchantId('')
      setMerchantInfo(null)
      setFormData({ amount: '', paymentMethod: 'mobile_money', description: '' })
    } catch (err: any) {
      setError(err.message || 'Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success && paymentResult) {
    return (
      <ProtectedRoute>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
                <p className="text-muted-foreground mb-6">
                  Your payment has been completed successfully
                </p>

                <div className="bg-muted rounded-lg p-4 mb-6 text-left">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Merchant:</span>
                      <span className="font-medium">{paymentResult.merchant.businessName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Merchant ID:</span>
                      <span className="font-medium">{paymentResult.merchant.merchantId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount Paid:</span>
                      <span className="font-medium">{formatCurrency(paymentResult.transaction.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fee (2%):</span>
                      <span className="font-medium text-orange-600">{formatCurrency(parseFloat(paymentResult.transaction.amount) * 0.02)}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Total Charged:</span>
                      <span>{formatCurrency(paymentResult.newBalance)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSuccess(false)
                      setPaymentResult(null)
                    }}
                    className="flex-1"
                  >
                    Pay Another Merchant
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Pay Merchant</h1>
          <p className="text-muted-foreground">Pay merchants using their unique 6-character ID</p>
        </div>

        {/* Merchant Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Find Merchant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearchMerchant} className="space-y-4">
              {error && !merchantInfo && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Merchant ID *</label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="ABC123"
                    value={merchantId}
                    onChange={(e) => setMerchantId(e.target.value.toUpperCase())}
                    maxLength={6}
                    required
                    disabled={searching}
                    className="uppercase font-mono text-lg tracking-wider"
                  />
                  <Button type="submit" disabled={searching || !merchantId}>
                    {searching ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter the 6-character merchant ID (letters and numbers)
                </p>
              </div>

              {merchantInfo && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Store className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-600 dark:text-green-400">
                        {merchantInfo.businessName}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        ID: {merchantInfo.merchantId}
                      </p>
                      {merchantInfo.isApproved ? (
                        <Badge className="mt-2" variant="secondary">Verified</Badge>
                      ) : (
                        <Badge className="mt-2" variant="destructive">Not Approved</Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Payment Form */}
        {merchantInfo && merchantInfo.isApproved && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Payment Details
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
                  <label className="text-sm font-medium">Amount (SLE) *</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => {
                      setFormData({ ...formData, amount: e.target.value })
                      setFee(calculateFee(parseFloat(e.target.value) || 0))
                    }}
                    required
                    disabled={loading}
                  />
                  {fee > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Fee (2%):</span>
                      <span className="text-orange-600 font-medium">{formatCurrency(fee)}</span>
                    </div>
                  )}
                  {fee > 0 && (
                    <div className="flex justify-between text-xs font-medium">
                      <span>Total:</span>
                      <span>{formatCurrency(parseFloat(formData.amount || '0') + fee)}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Payment Method *</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full p-2 border rounded-md"
                    disabled={loading}
                  >
                    <option value="mobile_money">Mobile Money</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description (Optional)</label>
                  <Input
                    placeholder="What's this payment for?"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    disabled={loading}
                  />
                </div>

                <Button
                  type="submit"
                  variant="gradient"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Store className="h-4 w-4 mr-2" />
                      Pay {formatCurrency(parseFloat(formData.amount || '0') + fee)}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {merchantInfo && !merchantInfo.isApproved && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-6">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
                <h3 className="text-lg font-semibold mb-2">Merchant Not Approved</h3>
                <p className="text-muted-foreground">
                  This merchant is not currently approved for payments. Please contact the merchant or try again later.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  )
}
