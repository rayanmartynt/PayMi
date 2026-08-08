'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Send, ArrowLeftRight, CheckCircle, AlertCircle, User } from 'lucide-react'
import { api } from '@/lib/api'
import ProtectedRoute from '@/components/ProtectedRoute'
import { formatCurrency } from '@/lib/utils'
import { useRouter, useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'

export default function CustomerTransferPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const friendId = searchParams.get('friendId')
  const friendName = searchParams.get('friendName')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [transferMode, setTransferMode] = useState<'email' | 'friend'>(friendId ? 'friend' : 'email')
  const [formData, setFormData] = useState({
    receiverEmail: '',
    friendId: friendId || '',
    amount: '',
    description: ''
  })
  const [transferResult, setTransferResult] = useState<any>(null)
  const [fee, setFee] = useState(0)

  // Calculate fee when amount or mode changes
  useEffect(() => {
    const amountValue = parseFloat(formData.amount) || 0
    const feeRate = transferMode === 'friend' ? 0.01 : 0.03 // 1% for friends, 3% for email
    setFee(amountValue * feeRate)
  }, [formData.amount, transferMode])

  // Update friendId from URL params
  useEffect(() => {
    if (friendId) {
      setTransferMode('friend')
      setFormData(prev => ({ ...prev, friendId }))
    }
  }, [friendId])

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

      let result
      if (transferMode === 'friend') {
        result = await api.sendToFriend(formData.friendId, amount, formData.description)
      } else {
        result = await api.createTransfer({
          receiverEmail: formData.receiverEmail,
          amount,
          description: formData.description
        })
      }

      setTransferResult(result)
      setSuccess(true)
      setFormData({ receiverEmail: '', friendId: '', amount: '', description: '' })
    } catch (err: any) {
      setError(err.message || 'Transfer failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success && transferResult) {
    return (
      <ProtectedRoute>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Transfer Successful!</h2>
                <p className="text-muted-foreground mb-6">
                  Your transfer has been completed successfully
                </p>

                <div className="bg-muted rounded-lg p-4 mb-6 text-left">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount Sent:</span>
                      <span className="font-medium">{formatCurrency(transferResult.amount)}</span>
                    </div>
                    {transferResult.fee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fee ({transferMode === 'friend' ? '1%' : '3%'}):</span>
                        <span className="font-medium text-orange-600">{formatCurrency(transferResult.fee)}</span>
                      </div>
                    )}
                    {transferResult.fee > 0 && (
                      <div className="flex justify-between font-semibold">
                        <span>Receiver Received:</span>
                        <span>{formatCurrency(parseFloat(transferResult.amount) - parseFloat(transferResult.fee))}</span>
                      </div>
                    )}
                    {transferResult.description && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Description:</span>
                        <span className="font-medium">{transferResult.description}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/customer/transfers')}
                    className="flex-1"
                  >
                    View Transfers
                  </Button>
                  <Button
                    variant="gradient"
                    onClick={() => {
                      setSuccess(false)
                      setTransferResult(null)
                      if (friendId) {
                        setFormData(prev => ({ ...prev, friendId, amount: '', description: '' }))
                      }
                    }}
                    className="flex-1"
                  >
                    Send Another
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
          <h1 className="text-3xl font-bold">Send Money</h1>
          <p className="text-muted-foreground">Transfer money to another customer</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              New Transfer
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

              {/* Transfer Mode Toggle */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={transferMode === 'email' ? 'default' : 'outline'}
                  onClick={() => setTransferMode('email')}
                  className="flex-1"
                >
                  By Email
                </Button>
                <Button
                  type="button"
                  variant={transferMode === 'friend' ? 'default' : 'outline'}
                  onClick={() => setTransferMode('friend')}
                  className="flex-1"
                >
                  To Friend
                </Button>
              </div>

              {transferMode === 'email' ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Receiver Email *</label>
                  <Input
                    type="email"
                    placeholder="customer@example.com"
                    value={formData.receiverEmail}
                    onChange={(e) => setFormData({ ...formData, receiverEmail: e.target.value })}
                    required
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the email address of the customer you want to send money to
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Friend *</label>
                  {friendName ? (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{decodeURIComponent(friendName)}</span>
                      <Badge variant="secondary">Friend</Badge>
                    </div>
                  ) : (
                    <>
                      <Input
                    type="text"
                    placeholder="Select a friend"
                    value={formData.friendId}
                    onChange={(e) => setFormData({ ...formData, friendId: e.target.value })}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    <a href="/customer/friends" className="text-blue-600 hover:underline">
                      Go to friends page
                    </a> to select a friend
                  </p>
                </>
              )}
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
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  disabled={loading}
                />
                {fee > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Fee ({transferMode === 'friend' ? '1%' : '3%'}):</span>
                    <span className="text-orange-600 font-medium">{formatCurrency(fee)}</span>
                  </div>
                )}
                {fee > 0 && (
                  <div className="flex justify-between text-xs font-medium">
                    <span>Receiver gets:</span>
                    <span>{formatCurrency(parseFloat(formData.amount || '0') - fee)}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description (Optional)</label>
                <Input
                  placeholder="What's this for?"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <ArrowLeftRight className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    <p className="font-medium mb-1">Transfer Information</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Transfers are instant</li>
                      <li>• Friend transfers have lower fees (1% vs 3%)</li>
                      <li>• Both sender and receiver must be verified customers</li>
                      <li>• Minimum transfer amount: 1 SLE</li>
                    </ul>
                  </div>
                </div>
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
                    <Send className="h-4 w-4 mr-2" />
                    Send Money
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
