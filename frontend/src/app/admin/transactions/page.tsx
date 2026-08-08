'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { AdvancedFilter, FilterConfig } from '@/components/ui/AdvancedFilter'
import { ExportButton } from '@/components/ui/ExportButton'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { api } from '@/lib/api'
import { Loader2 } from 'lucide-react'

interface Transaction {
  id: string
  merchantId: string
  merchant?: {
    businessName: string
  }
  amount: number
  paymentMethod: string
  status: string
  createdAt: Date
  customerName?: string
  customerEmail?: string
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState<Record<string, any>>({
    search: '',
    merchant: '',
    status: '',
    paymentMethod: '',
    minAmount: '',
    maxAmount: '',
    dateFrom: '',
    dateTo: '',
  })

  useEffect(() => {
    loadTransactions()
  }, [])

  const loadTransactions = async () => {
    try {
      // Use admin endpoint to get all transactions
      const data = await api.getAllTransactions(1, 100)
      setTransactions(Array.isArray(data) ? data : (data as any).transactions || [])
    } catch (error: any) {
      console.error('Failed to load transactions:', error)
      setError(error.message || 'Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = !filters.search || 
      transaction.id.toLowerCase().includes(filters.search.toLowerCase()) ||
      transaction.customerName?.toLowerCase().includes(filters.search.toLowerCase()) ||
      transaction.customerEmail?.toLowerCase().includes(filters.search.toLowerCase())

    const matchesMerchant = !filters.merchant || transaction.merchantId === filters.merchant
    const matchesStatus = !filters.status || transaction.status === filters.status
    const matchesMethod = !filters.paymentMethod || transaction.paymentMethod === filters.paymentMethod
    
    const matchesMinAmount = !filters.minAmount || transaction.amount >= parseFloat(filters.minAmount)
    const matchesMaxAmount = !filters.maxAmount || transaction.amount <= parseFloat(filters.maxAmount)
    
    const matchesDateFrom = !filters.dateFrom || new Date(transaction.createdAt) >= new Date(filters.dateFrom)
    const matchesDateTo = !filters.dateTo || new Date(transaction.createdAt) <= new Date(filters.dateTo)

    return matchesSearch && matchesMerchant && matchesStatus && matchesMethod && matchesMinAmount && matchesMaxAmount && matchesDateFrom && matchesDateTo
  })

  const filterConfigs: FilterConfig[] = [
    {
      id: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Search by ID, customer, or email...',
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Successful', value: 'successful' },
        { label: 'Pending', value: 'pending' },
        { label: 'Failed', value: 'failed' },
        { label: 'Refunded', value: 'refunded' },
      ],
    },
    {
      id: 'paymentMethod',
      label: 'Payment Method',
      type: 'select',
      options: [
        { label: 'Orange Money', value: 'orange_money' },
        { label: 'Afrimoney', value: 'afrimoney' },
        { label: 'QMoney', value: 'qmoney' },
      ],
    },
    {
      id: 'minAmount',
      label: 'Min Amount',
      type: 'number',
      placeholder: 'Min amount (SLE)',
    },
    {
      id: 'maxAmount',
      label: 'Max Amount',
      type: 'number',
      placeholder: 'Max amount (SLE)',
    },
    {
      id: 'dateFrom',
      label: 'Date From',
      type: 'date',
    },
    {
      id: 'dateTo',
      label: 'Date To',
      type: 'date',
    },
  ]

  const exportColumns = [
    { key: 'id', label: 'Transaction ID' },
    { key: 'merchantId', label: 'Merchant ID' },
    { key: 'customerName', label: 'Customer Name' },
    { key: 'customerEmail', label: 'Customer Email' },
    { key: 'amount', label: 'Amount', format: formatCurrency },
    { key: 'paymentMethod', label: 'Payment Method', format: (value: string) => value.replace('_', ' ').toUpperCase() },
    { key: 'status', label: 'Status', format: (value: string) => value.toUpperCase() },
    { key: 'createdAt', label: 'Date', format: formatDateTime },
  ]

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
        <h1 className="text-3xl font-bold">All Transactions</h1>
        <p className="text-muted-foreground">Monitor platform-wide transactions</p>
      </div>

      <AdvancedFilter
        filters={filterConfigs}
        onFilterChange={setFilters}
        onReset={() => setFilters({
          search: '',
          merchant: '',
          status: '',
          paymentMethod: '',
          minAmount: '',
          maxAmount: '',
          dateFrom: '',
          dateTo: '',
        })}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            Transactions ({filteredTransactions.length})
          </CardTitle>
          <ExportButton
            data={filteredTransactions}
            columns={exportColumns}
            filename="all-transactions"
            title="All Transactions Report"
            subtitle={`Showing ${filteredTransactions.length} transactions`}
            variant="split"
            size="sm"
          />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium text-sm">Transaction ID</th>
                  <th className="text-left p-4 font-medium text-sm">Merchant</th>
                  <th className="text-left p-4 font-medium text-sm">Customer</th>
                  <th className="text-left p-4 font-medium text-sm">Amount</th>
                  <th className="text-left p-4 font-medium text-sm">Method</th>
                  <th className="text-left p-4 font-medium text-sm">Status</th>
                  <th className="text-left p-4 font-medium text-sm">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-muted-foreground">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b hover:bg-muted/50">
                      <td className="p-4 text-sm font-mono">{transaction.id.substring(0, 8)}...</td>
                      <td className="p-4 text-sm">{transaction.merchant?.businessName || transaction.merchantId}</td>
                      <td className="p-4 text-sm">
                        <div>{transaction.customerName || '-'}</div>
                        <div className="text-xs text-muted-foreground">{transaction.customerEmail || '-'}</div>
                      </td>
                      <td className="p-4 text-sm font-semibold">{formatCurrency(transaction.amount)}</td>
                      <td className="p-4 text-sm">{transaction.paymentMethod.replace('_', ' ').toUpperCase()}</td>
                      <td className="p-4">
                        <Badge variant={
                          transaction.status === 'successful' ? 'success' :
                          transaction.status === 'pending' ? 'warning' :
                          transaction.status === 'failed' ? 'destructive' :
                          'secondary'
                        }>
                          {transaction.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{formatDateTime(transaction.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
