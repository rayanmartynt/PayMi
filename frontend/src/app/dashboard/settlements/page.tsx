'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Wallet, ArrowDownToLine, Calendar, Building2, Loader2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import { api } from '@/lib/api'

export default function SettlementsPage() {
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const [merchant, setMerchant] = useState<any>(null)
  const [settlements, setSettlements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [merchantData, settlementsData] = await Promise.all([
        api.getMerchantProfile(),
        api.getSettlements()
      ])
      setMerchant(merchantData)
      setSettlements((settlementsData as any).settlements || [])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settlements</h1>
          <p className="text-muted-foreground">Manage your settlements and withdrawals</p>
        </div>
        <Button onClick={() => setIsWithdrawModalOpen(true)} variant="gradient">
          <ArrowDownToLine className="h-4 w-4 mr-2" />
          Request Withdrawal
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(merchant?.balance || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready for withdrawal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Balance</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(merchant?.pendingBalance || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting settlement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Settled</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(merchant?.totalSettled || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Settlement History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {settlements.length === 0 ? (
              <p className="text-muted-foreground text-sm">No settlements yet</p>
            ) : (
              settlements.map((settlement) => (
                <div key={settlement.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-semibold">{formatCurrency(settlement.amount)}</div>
                    <div className="text-sm text-muted-foreground">
                      {settlement.mobileMoneyProvider} • {settlement.mobileNumber}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Requested {formatDate(settlement.createdAt)}
                      {settlement.processedAt && ` • Processed ${formatDate(settlement.processedAt)}`}
                    </div>
                  </div>
                  <Badge 
                    variant={
                      settlement.status === 'completed' ? 'success' :
                      settlement.status === 'pending' ? 'warning' :
                      settlement.status === 'processing' ? 'secondary' :
                      'destructive'
                    }
                  >
                    {settlement.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        availableBalance={merchant?.balance || 0}
        onSuccess={() => {
          loadData()
          setIsWithdrawModalOpen(false)
        }}
      />
    </div>
  )
}

function WithdrawModal({
  isOpen,
  onClose,
  availableBalance,
  onSuccess
}: {
  isOpen: boolean
  onClose: () => void
  availableBalance: number
  onSuccess: () => void
}) {
  const [amount, setAmount] = useState('')
  const [mobileMoneyProvider, setMobileMoneyProvider] = useState('')
  const [mobileNumber, setMobileNumber] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!amount || !mobileMoneyProvider || !mobileNumber) {
      return
    }

    if (parseFloat(amount) > availableBalance) {
      alert('Insufficient balance')
      return
    }

    setLoading(true)
    try {
      await api.requestWithdrawal({
        amount: parseFloat(amount),
        mobileMoneyProvider,
        mobileNumber
      })
      onSuccess()
    } catch (error) {
      console.error('Withdrawal failed:', error)
      alert('Failed to request withdrawal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request Withdrawal">
      <div className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-blue-800 dark:text-blue-200">Available Balance</span>
            <span className="font-bold text-blue-800 dark:text-blue-200">{formatCurrency(availableBalance)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Amount</label>
          <Input 
            type="number" 
            placeholder="Enter amount" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            max={availableBalance}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Mobile Money Provider</label>
          <select 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={mobileMoneyProvider}
            onChange={(e) => setMobileMoneyProvider(e.target.value)}
          >
            <option value="">Select provider</option>
            <option value="ORANGE_MONEY">Orange Money</option>
            <option value="AFRIMONEY">Afrimoney</option>
            <option value="QMONEY">QMoney</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Mobile Number</label>
          <Input 
            placeholder="+232 76 123 456"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="gradient" onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Request Withdrawal
          </Button>
        </div>
      </div>
    </Modal>
  )
}
