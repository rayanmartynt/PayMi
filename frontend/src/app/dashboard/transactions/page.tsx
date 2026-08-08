'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { TransactionsTable } from '@/components/dashboard/TransactionsTable'
import { AdvancedFilter, FilterConfig } from '@/components/ui/AdvancedFilter'
import { ExportButton } from '@/components/ui/ExportButton'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { api } from '@/lib/api'
import { Loader2 } from 'lucide-react'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Record<string, any>>({
    search: '',
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
      const data = await api.getTransactions()
      setTransactions((data as any).transactions || [])
    } catch (error) {
      console.error('Failed to load transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = !filters.search || 
      transaction.id.toLowerCase().includes(filters.search.toLowerCase()) ||
      transaction.customer?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      transaction.customer?.user?.email?.toLowerCase().includes(filters.search.toLowerCase())

    const matchesStatus = !filters.status || transaction.status.toLowerCase() === filters.status.toLowerCase()
    const matchesMethod = !filters.paymentMethod || transaction.paymentMethod.toLowerCase() === filters.paymentMethod.toLowerCase()
    
    const matchesMinAmount = !filters.minAmount || transaction.amount >= parseFloat(filters.minAmount)
    const matchesMaxAmount = !filters.maxAmount || transaction.amount <= parseFloat(filters.maxAmount)
    
    const matchesDateFrom = !filters.dateFrom || new Date(transaction.createdAt) >= new Date(filters.dateFrom)
    const matchesDateTo = !filters.dateTo || new Date(transaction.createdAt) <= new Date(filters.dateTo)

    return matchesSearch && matchesStatus && matchesMethod && matchesMinAmount && matchesMaxAmount && matchesDateFrom && matchesDateTo
  })

  const filterConfigs: FilterConfig[] = [
    {
      id: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Search by ID, customer name, or email...',
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Successful', value: 'SUCCESSFUL' },
        { label: 'Pending', value: 'PENDING' },
        { label: 'Failed', value: 'FAILED' },
        { label: 'Refunded', value: 'REFUNDED' },
      ],
    },
    {
      id: 'paymentMethod',
      label: 'Payment Method',
      type: 'select',
      options: [
        { label: 'Orange Money', value: 'ORANGE_MONEY' },
        { label: 'Afrimoney', value: 'AFRIMONEY' },
        { label: 'QMoney', value: 'QMONEY' },
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
    { key: 'customer', label: 'Customer Name', format: (value: any) => value?.name || 'N/A' },
    { key: 'amount', label: 'Amount', format: formatCurrency },
    { key: 'paymentMethod', label: 'Payment Method', format: (value: string) => value.replace('_', ' ') },
    { key: 'status', label: 'Status', format: (value: string) => value },
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
        <h1 className="text-3xl font-bold">Transactions</h1>
        <p className="text-muted-foreground">View and manage all your transactions</p>
      </div>

      <AdvancedFilter
        filters={filterConfigs}
        onFilterChange={setFilters}
        onReset={() => setFilters({
          search: '',
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
            filename="transactions"
            title="Transactions Report"
            subtitle={`Showing ${filteredTransactions.length} transactions`}
            variant="split"
            size="sm"
          />
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No transactions yet</p>
          ) : (
            <TransactionsTable transactions={filteredTransactions} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
