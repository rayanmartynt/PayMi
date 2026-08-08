'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { 
  Wallet, 
  Plus, 
  Trash2, 
  Star, 
  ArrowUpRight, 
  CheckCircle, 
  XCircle, 
  Clock,
  Building2,
  Download
} from 'lucide-react'
import { api } from '@/lib/api'
import ProtectedRoute from '@/components/ProtectedRoute'
import { formatCurrency } from '@/lib/utils'

export default function AdminFeesPage() {
  const [balance, setBalance] = useState('0')
  const [fees, setFees] = useState<any[]>([])
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddBankForm, setShowAddBankForm] = useState(false)
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false)
  const [error, setError] = useState('')
  
  const [bankFormData, setBankFormData] = useState({
    bankName: '',
    accountNumber: '',
    accountName: '',
    isDefault: false
  })
  
  const [withdrawalFormData, setWithdrawalFormData] = useState({
    amount: '',
    bankAccountId: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [balanceData, feesData, bankAccountsData, withdrawalsData] = await Promise.all([
        api.getAdminBalance(),
        api.getAdminFeesHistory(),
        api.getAdminBankAccounts(),
        api.getAdminWithdrawals()
      ])
      
      setBalance(balanceData.balance || '0')
      setFees(feesData.fees || [])
      setBankAccounts(bankAccountsData || [])
      setWithdrawals(withdrawalsData.withdrawals || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleAddBankAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    try {
      await api.addAdminBankAccount(bankFormData)
      setShowAddBankForm(false)
      setBankFormData({ bankName: '', accountNumber: '', accountName: '', isDefault: false })
      loadData()
    } catch (err: any) {
      setError(err.message || 'Failed to add bank account')
    }
  }

  const handleDeleteBankAccount = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bank account?')) return
    
    try {
      await api.deleteAdminBankAccount(id)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to delete bank account')
    }
  }

  const handleSetDefaultBankAccount = async (id: string) => {
    try {
      await api.setDefaultAdminBankAccount(id)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to set default bank account')
    }
  }

  const handleCreateWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    try {
      await api.createAdminWithdrawal({
        amount: parseFloat(withdrawalFormData.amount),
        bankAccountId: withdrawalFormData.bankAccountId
      })
      setShowWithdrawalForm(false)
      setWithdrawalFormData({ amount: '', bankAccountId: '' })
      loadData()
    } catch (err: any) {
      setError(err.message || 'Failed to create withdrawal')
    }
  }

  const handleProcessWithdrawal = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    if (!confirm(`Are you sure you want to ${status.toLowerCase()} this withdrawal?`)) return
    
    try {
      await api.processAdminWithdrawal(id, { status })
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to process withdrawal')
    }
  }

  const getWithdrawalStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-500'
      case 'REJECTED': return 'bg-red-500'
      case 'PENDING': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Fee Management</h1>
          <p className="text-muted-foreground">Manage transaction fees and withdrawals</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Balance Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Admin Wallet Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{formatCurrency(parseFloat(balance))}</div>
            <p className="text-sm text-muted-foreground mt-1">Available for withdrawal</p>
          </CardContent>
        </Card>

        {/* Bank Accounts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Bank Accounts
              </CardTitle>
              <Button
                variant="gradient"
                onClick={() => setShowAddBankForm(!showAddBankForm)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Bank Account
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showAddBankForm && (
              <form onSubmit={handleAddBankAccount} className="space-y-4 mb-6 p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bank Name</label>
                    <Input
                      placeholder="Rokel Commercial Bank"
                      value={bankFormData.bankName}
                      onChange={(e) => setBankFormData({ ...bankFormData, bankName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Account Number</label>
                    <Input
                      placeholder="1234567890"
                      value={bankFormData.accountNumber}
                      onChange={(e) => setBankFormData({ ...bankFormData, accountNumber: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Account Name</label>
                  <Input
                    placeholder="PayMi Admin Account"
                    value={bankFormData.accountName}
                    onChange={(e) => setBankFormData({ ...bankFormData, accountName: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={bankFormData.isDefault}
                    onChange={(e) => setBankFormData({ ...bankFormData, isDefault: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="isDefault" className="text-sm">Set as default</label>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" variant="gradient">Add Account</Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddBankForm(false)}>Cancel</Button>
                </div>
              </form>
            )}

            {bankAccounts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No bank accounts added yet
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {bankAccounts.map((account) => (
                  <div key={account.id} className="p-4 border rounded-lg hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{account.bankName}</p>
                          {account.isDefault && (
                            <Badge variant="success" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{account.accountName}</p>
                        <p className="text-sm text-muted-foreground">{account.accountNumber}</p>
                      </div>
                      <div className="flex gap-2">
                        {!account.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetDefaultBankAccount(account.id)}
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteBankAccount(account.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Withdrawals */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ArrowUpRight className="h-5 w-5" />
                Withdrawals
              </CardTitle>
              <Button
                variant="gradient"
                onClick={() => setShowWithdrawalForm(!showWithdrawalForm)}
                disabled={bankAccounts.length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Request Withdrawal
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showWithdrawalForm && (
              <form onSubmit={handleCreateWithdrawal} className="space-y-4 mb-6 p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount (SLE)</label>
                    <Input
                      type="number"
                      placeholder="1000"
                      value={withdrawalFormData.amount}
                      onChange={(e) => setWithdrawalFormData({ ...withdrawalFormData, amount: e.target.value })}
                      max={parseFloat(balance)}
                    />
                    <p className="text-xs text-muted-foreground">Available: {formatCurrency(parseFloat(balance))}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bank Account</label>
                    <select
                      value={withdrawalFormData.bankAccountId}
                      onChange={(e) => setWithdrawalFormData({ ...withdrawalFormData, bankAccountId: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    >
                      <option value="">Select bank account</option>
                      {bankAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.bankName} - {account.accountNumber}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" variant="gradient">Request Withdrawal</Button>
                  <Button type="button" variant="outline" onClick={() => setShowWithdrawalForm(false)}>Cancel</Button>
                </div>
              </form>
            )}

            {withdrawals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No withdrawals yet
              </div>
            ) : (
              <div className="space-y-4">
                {withdrawals.map((withdrawal) => (
                  <div key={withdrawal.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-full ${getWithdrawalStatusColor(withdrawal.status)} flex items-center justify-center`}>
                          {withdrawal.status === 'APPROVED' && <CheckCircle className="h-5 w-5 text-white" />}
                          {withdrawal.status === 'REJECTED' && <XCircle className="h-5 w-5 text-white" />}
                          {withdrawal.status === 'PENDING' && <Clock className="h-5 w-5 text-white" />}
                        </div>
                        <div>
                          <p className="font-medium">{formatCurrency(parseFloat(withdrawal.amount))}</p>
                          <p className="text-sm text-muted-foreground">{withdrawal.reference}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={withdrawal.status === 'APPROVED' ? 'success' : withdrawal.status === 'REJECTED' ? 'destructive' : 'warning'}>
                          {withdrawal.status}
                        </Badge>
                        {withdrawal.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleProcessWithdrawal(withdrawal.id, 'APPROVED')}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleProcessWithdrawal(withdrawal.id, 'REJECTED')}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(withdrawal.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fee History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Fee Collection History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {fees.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No fee collection history
              </div>
            ) : (
              <div className="space-y-4">
                {fees.map((fee) => (
                  <div key={fee.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{formatCurrency(parseFloat(fee.fee))}</p>
                        <p className="text-sm text-muted-foreground">{fee.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{formatCurrency(parseFloat(fee.amount))} transaction</p>
                        <Badge variant={fee.isCollected ? 'success' : 'warning'}>
                          {fee.isCollected ? 'Collected' : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(fee.createdAt).toLocaleString()}
                    </p>
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
