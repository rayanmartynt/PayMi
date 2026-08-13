'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { DollarSign, Send, CheckCircle, XCircle, Clock, AlertCircle, User } from 'lucide-react'
import { api } from '@/lib/api'
import ProtectedRoute from '@/components/ProtectedRoute'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

export default function RequestMoneyPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [friends, setFriends] = useState<any[]>([])
  const [receivedRequests, setReceivedRequests] = useState<any[]>([])
  const [sentRequests, setSentRequests] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'request' | 'received' | 'sent'>('request')
  const [formData, setFormData] = useState({
    receiverId: '',
    amount: '',
    description: '',
    expiresIn: ''
  })

  useEffect(() => {
    loadFriends()
    loadReceivedRequests()
    loadSentRequests()
  }, [])

  const loadFriends = async () => {
    try {
      const data = await api.getFriends() as any[]
      setFriends(data)
    } catch (err: any) {
      console.error('Failed to load friends:', err)
    }
  }

  const loadReceivedRequests = async () => {
    try {
      const data = await api.getReceivedMoneyRequests('PENDING') as any[]
      setReceivedRequests(data)
    } catch (err: any) {
      console.error('Failed to load received requests:', err)
    }
  }

  const loadSentRequests = async () => {
    try {
      const data = await api.getSentMoneyRequests() as any[]
      setSentRequests(data)
    } catch (err: any) {
      console.error('Failed to load sent requests:', err)
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

      if (!formData.receiverId) {
        setError('Please select a friend')
        setLoading(false)
        return
      }

      const expiresIn = formData.expiresIn ? parseInt(formData.expiresIn) : undefined
      await api.createMoneyRequest(formData.receiverId, amount, formData.description, expiresIn)

      setSuccess(true)
      setFormData({ receiverId: '', amount: '', description: '', expiresIn: '' })
      loadSentRequests()
      toast.success('Money request sent successfully')
    } catch (err: any) {
      setError(err.message || 'Failed to send money request')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await api.acceptMoneyRequest(requestId)
      toast.success('Money request accepted')
      loadReceivedRequests()
    } catch (err: any) {
      toast.error(err.message || 'Failed to accept request')
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      await api.rejectMoneyRequest(requestId)
      toast.success('Money request rejected')
      loadReceivedRequests()
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject request')
    }
  }

  const handleCancelRequest = async (requestId: string) => {
    try {
      await api.cancelMoneyRequest(requestId)
      toast.success('Money request cancelled')
      loadSentRequests()
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel request')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="warning"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'ACCEPTED':
        return <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" />Accepted</Badge>
      case 'REJECTED':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      case 'CANCELLED':
        return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Request Money</h1>
          <p className="text-muted-foreground">Request money from your friends</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'request' ? 'default' : 'outline'}
            onClick={() => setActiveTab('request')}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            New Request
          </Button>
          <Button
            variant={activeTab === 'received' ? 'default' : 'outline'}
            onClick={() => setActiveTab('received')}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Received ({receivedRequests.length})
          </Button>
          <Button
            variant={activeTab === 'sent' ? 'default' : 'outline'}
            onClick={() => setActiveTab('sent')}
          >
            <Send className="h-4 w-4 mr-2" />
            Sent ({sentRequests.length})
          </Button>
        </div>

        {/* New Request Form */}
        {activeTab === 'request' && (
          <Card>
            <CardHeader>
              <CardTitle>Send Money Request</CardTitle>
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
                  <label className="text-sm font-medium">Select Friend *</label>
                  <select
                    value={formData.receiverId}
                    onChange={(e) => setFormData({ ...formData, receiverId: e.target.value })}
                    className="w-full p-2 border rounded-md"
                    required
                    disabled={loading}
                  >
                    <option value="">Choose a friend</option>
                    {friends.map((friend) => (
                      <option key={friend.id} value={friend.id}>
                        {friend.name || friend.email}
                      </option>
                    ))}
                  </select>
                  {friends.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      <a href="/customer/friends" className="text-blue-600 hover:underline">
                        Add friends first
                      </a> to request money
                    </p>
                  )}
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
                    disabled={loading}
                  />
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

                <div className="space-y-2">
                  <label className="text-sm font-medium">Expires In (days, optional)</label>
                  <Input
                    type="number"
                    placeholder="Leave empty for no expiration"
                    value={formData.expiresIn}
                    onChange={(e) => setFormData({ ...formData, expiresIn: e.target.value })}
                    min="1"
                    disabled={loading}
                  />
                </div>

                <Button
                  type="submit"
                  variant="gradient"
                  className="w-full"
                  disabled={loading || friends.length === 0}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Send Request
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Received Requests */}
        {activeTab === 'received' && (
          <Card>
            <CardHeader>
              <CardTitle>Received Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {receivedRequests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending money requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {receivedRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white">
                            <User className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">{request.requester?.name || request.requester?.email}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{formatCurrency(parseFloat(request.amount))}</p>
                          {getStatusBadge(request.status)}
                        </div>
                      </div>
                      {request.description && (
                        <p className="text-sm text-muted-foreground">{request.description}</p>
                      )}
                      {request.expiresAt && (
                        <p className="text-xs text-muted-foreground">
                          Expires: {new Date(request.expiresAt).toLocaleDateString()}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="gradient"
                          onClick={() => handleAcceptRequest(request.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accept & Pay
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectRequest(request.id)}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Sent Requests */}
        {activeTab === 'sent' && (
          <Card>
            <CardHeader>
              <CardTitle>Sent Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {sentRequests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No money requests sent yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sentRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white">
                            <User className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">{request.receiver?.name || request.receiver?.email}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{formatCurrency(parseFloat(request.amount))}</p>
                          {getStatusBadge(request.status)}
                        </div>
                      </div>
                      {request.description && (
                        <p className="text-sm text-muted-foreground">{request.description}</p>
                      )}
                      {request.expiresAt && (
                        <p className="text-xs text-muted-foreground">
                          Expires: {new Date(request.expiresAt).toLocaleDateString()}
                        </p>
                      )}
                      {request.status === 'PENDING' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelRequest(request.id)}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Cancel Request
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  )
}
