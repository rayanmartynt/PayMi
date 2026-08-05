'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { CreditCard, Plus, Trash2, Star } from 'lucide-react'
import { api } from '@/lib/api'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function CustomerPaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    type: 'ORANGE_MONEY',
    phoneNumber: ''
  })

  useEffect(() => {
    loadPaymentMethods()
  }, [])

  const loadPaymentMethods = async () => {
    try {
      setLoading(true)
      const data = await api.getPaymentMethods()
      setPaymentMethods(data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load payment methods')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setAdding(true)

    try {
      await api.addPaymentMethod(formData)
      setShowAddForm(false)
      setFormData({ type: 'ORANGE_MONEY', phoneNumber: '' })
      loadPaymentMethods()
    } catch (err: any) {
      setError(err.message || 'Failed to add payment method')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return

    try {
      await api.deletePaymentMethod(id)
      loadPaymentMethods()
    } catch (err: any) {
      alert(err.message || 'Failed to delete payment method')
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await api.setDefaultPaymentMethod(id)
      loadPaymentMethods()
    } catch (err: any) {
      alert(err.message || 'Failed to set default payment method')
    }
  }

  const getProviderName = (type: string) => {
    switch (type) {
      case 'ORANGE_MONEY':
        return 'Orange Money'
      case 'AFRIMONEY':
        return 'Afrimoney'
      case 'QMONEY':
        return 'QMoney'
      default:
        return type
    }
  }

  const getProviderColor = (type: string) => {
    switch (type) {
      case 'ORANGE_MONEY':
        return 'bg-orange-500'
      case 'AFRIMONEY':
        return 'bg-blue-500'
      case 'QMONEY':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Payment Methods</h1>
            <p className="text-muted-foreground">Manage your mobile money accounts</p>
          </div>
          <Button
            variant="gradient"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Payment Method
          </Button>
        </div>

        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>Add New Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mobile Money Provider</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    disabled={adding}
                  >
                    <option value="ORANGE_MONEY">Orange Money</option>
                    <option value="AFRIMONEY">Afrimoney</option>
                    <option value="QMONEY">QMoney</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input
                    type="tel"
                    placeholder="+232 76 123 456"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    disabled={adding}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    variant="gradient"
                    disabled={adding}
                    className="flex-1"
                  >
                    {adding ? 'Adding...' : 'Add Payment Method'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false)
                      setError('')
                      setFormData({ type: 'ORANGE_MONEY', phoneNumber: '' })
                    }}
                    disabled={adding}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Your Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : paymentMethods.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No payment methods added yet
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className="relative p-4 border rounded-lg hover:border-primary/50 transition-colors"
                  >
                    {method.isDefault && (
                      <Badge className="absolute top-4 right-4" variant="success">
                        <Star className="h-3 w-3 mr-1" />
 Default
                      </Badge>
                    )}
                    <div className="flex items-start gap-4">
                      <div className={`h-12 w-12 rounded-lg ${getProviderColor(method.type)} flex items-center justify-center`}>
                        <CreditCard className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{getProviderName(method.type)}</p>
                        <p className="text-sm text-muted-foreground">{method.phoneNumber}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      {!method.isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(method.id)}
                          className="flex-1"
                        >
                          <Star className="h-4 w-4 mr-1" />
                          Set Default
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(method.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
