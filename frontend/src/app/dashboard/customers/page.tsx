'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Search, Mail, Phone, TrendingUp, Calendar } from 'lucide-react'
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import { AdvancedFilter, FilterConfig } from '@/components/ui/AdvancedFilter'
import { ExportButton } from '@/components/ui/ExportButton'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filters, setFilters] = useState<Record<string, any>>({
    search: '',
    verified: '',
    minLifetimeValue: '',
    maxLifetimeValue: '',
  })
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [cust, txn] = await Promise.all([api.getCustomers(), api.getTransactions()]);
        setCustomers(cust as any[]);
        setTransactions(txn as any[]);
      } catch (error) {
        console.error('Failed to load data:', error);
        setCustomers([]);
        setTransactions([]);
      }
    }
    load();
  }, []);

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch = !filters.search || 
      customer.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      customer.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(filters.search.toLowerCase())

    const matchesVerified = filters.verified === '' || 
      (filters.verified === 'true' && customer.verified) ||
      (filters.verified === 'false' && !customer.verified)

    const matchesMinValue = !filters.minLifetimeValue || customer.lifetimeValue >= parseFloat(filters.minLifetimeValue)
    const matchesMaxValue = !filters.maxLifetimeValue || customer.lifetimeValue <= parseFloat(filters.maxLifetimeValue)

    return matchesSearch && matchesVerified && matchesMinValue && matchesMaxValue
  })

  const filterConfigs: FilterConfig[] = [
    {
      id: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Search by name, email, or phone...',
    },
    {
      id: 'verified',
      label: 'Verification Status',
      type: 'select',
      options: [
        { label: 'Verified', value: 'true' },
        { label: 'Unverified', value: 'false' },
      ],
    },
    {
      id: 'minLifetimeValue',
      label: 'Min Lifetime Value',
      type: 'number',
      placeholder: 'Min value (SLE)',
    },
    {
      id: 'maxLifetimeValue',
      label: 'Max Lifetime Value',
      type: 'number',
      placeholder: 'Max value (SLE)',
    },
  ]

  const exportColumns = [
    { key: 'name', label: 'Customer Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'lifetimeValue', label: 'Lifetime Value', format: formatCurrency },
    { key: 'totalPayments', label: 'Total Payments' },
    { key: 'verified', label: 'Verified', format: (value: boolean) => value ? 'Yes' : 'No' },
    { key: 'createdAt', label: 'Member Since', format: formatDate },
  ]

  const getCustomerTransactions = (customerId: string) => {
    return transactions.filter(t => t.customerId === customerId)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground">Manage your customer base</p>
        </div>
        <ExportButton
          data={filteredCustomers}
          columns={exportColumns}
          filename="customers"
          title="Customers Report"
          subtitle={`Showing ${filteredCustomers.length} customers`}
          variant="dropdown"
          size="default"
        />
      </div>

      <AdvancedFilter
        filters={filterConfigs}
        onFilterChange={setFilters}
        onReset={() => setFilters({
          search: '',
          verified: '',
          minLifetimeValue: '',
          maxLifetimeValue: '',
        })}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCustomers.map((customer) => {
          return (
            <Card 
              key={customer.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedCustomer(customer)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">
                    {customer.name.charAt(0)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{customer.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{customer.email}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {customer.email}
                </div>
                {customer.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {customer.phone}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="font-semibold">{formatCurrency(customer.lifetimeValue)}</span>
                  <span className="text-muted-foreground">lifetime value</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span className="font-semibold">{customer.totalPayments}</span>
                  <span className="text-muted-foreground">payments</span>
                </div>
                <div className="pt-2 border-t">
                  <Badge variant={customer.verified ? 'success' : 'secondary'}>
                    {customer.verified ? 'Verified' : 'Unverified'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          transactions={getCustomerTransactions(selectedCustomer.id)}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  )
}

function CustomerDetailModal({
  customer,
  transactions,
  onClose
}: {
  customer: any
  transactions: any[]
  onClose: () => void
}) {
  return (
    <Modal isOpen={!!customer} onClose={onClose} title="Customer Details" size="lg">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
            {customer.name.charAt(0)}
          </div>
          <div>
            <h3 className="text-xl font-bold">{customer.name}</h3>
            <p className="text-muted-foreground">{customer.email}</p>
            <Badge variant={customer.verified ? 'success' : 'secondary'} className="mt-2">
              {customer.verified ? 'Verified' : 'Unverified'}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Lifetime Value</div>
              <div className="text-2xl font-bold">{formatCurrency(customer.lifetimeValue)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Total Payments</div>
              <div className="text-2xl font-bold">{customer.totalPayments}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Member Since</div>
              <div className="text-2xl font-bold">{formatDate(customer.createdAt)}</div>
            </CardContent>
          </Card>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Recent Transactions</h4>
          <div className="space-y-2">
            {transactions.length === 0 ? (
              <p className="text-muted-foreground text-sm">No transactions yet</p>
            ) : (
              transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <div className="font-medium">{transaction.description || 'Payment'}</div>
                    <div className="text-sm text-muted-foreground">{formatDate(transaction.createdAt)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(transaction.amount)}</div>
                    <Badge variant={transaction.status === 'successful' ? 'success' : transaction.status === 'failed' ? 'destructive' : 'warning'}>
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  )
}
