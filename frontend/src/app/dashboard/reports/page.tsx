'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { 
  Download, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Wallet,
  Filter,
  FileText,
  BarChart3,
  Loader2
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { api } from '@/lib/api'

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('30d')
  const [reportType, setReportType] = useState('revenue')
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<any>(null)

  useEffect(() => {
    loadReportData()
  }, [dateRange])

  const loadReportData = async () => {
    try {
      const [analytics, transactions] = await Promise.all([
        api.getAnalytics(),
        api.getTransactions()
      ])

      const transactionsList = (transactions as any).transactions || []
      const analyticsData = analytics as any

      // Group transactions by date for revenue trend
      const revenueByDate = transactionsList.reduce((acc: any, t: any) => {
        const date = new Date(t.createdAt).toISOString().split('T')[0]
        if (!acc[date]) {
          acc[date] = { date, amount: 0, transactions: 0 }
        }
        acc[date].amount += t.amount
        acc[date].transactions += 1
        return acc
      }, {})

      const revenue = Object.values(revenueByDate).sort((a: any, b: any) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      ).slice(-7) // Last 7 days

      // Group by payment method
      const paymentMethodsMap = transactionsList.reduce((acc: any, t: any) => {
        const method = t.paymentMethod.replace('_', ' ')
        if (!acc[method]) {
          acc[method] = { method, amount: 0, transactions: 0 }
        }
        acc[method].amount += t.amount
        acc[method].transactions += 1
        return acc
      }, {})

      const totalAmount: number = Object.values(paymentMethodsMap).reduce((sum: number, item: any) => sum + item.amount, 0)
      const paymentMethods = Object.values(paymentMethodsMap).map((item: any) => ({
        ...item,
        percentage: totalAmount > 0 ? ((item.amount / totalAmount) * 100).toFixed(1) : 0
      }))

      // Group by customer (for segments)
      const customerMap = transactionsList.reduce((acc: any, t: any) => {
        const customerId = t.customerId || 'guest'
        if (!acc[customerId]) {
          acc[customerId] = { count: 0, revenue: 0 }
        }
        acc[customerId].count += 1
        acc[customerId].revenue += t.amount
        return acc
      }, {})

      const customers = Object.values(customerMap)
      const newCustomers = customers.filter((c: any) => c.count === 1).length
      const returningCustomers = customers.filter((c: any) => c.count > 1 && c.count <= 5).length
      const vipCustomers = customers.filter((c: any) => c.count > 5).length

      const customerSegments = [
        { segment: 'New Customers', count: newCustomers, revenue: customers.filter((c: any) => c.count === 1).reduce((sum: any, c: any) => sum + c.revenue, 0) },
        { segment: 'Returning', count: returningCustomers, revenue: customers.filter((c: any) => c.count > 1 && c.count <= 5).reduce((sum: any, c: any) => sum + c.revenue, 0) },
        { segment: 'VIP', count: vipCustomers, revenue: customers.filter((c: any) => c.count > 5).reduce((sum: any, c: any) => sum + c.revenue, 0) },
      ]

      // Top products/services (group by description)
      const productMap = transactionsList.reduce((acc: any, t: any) => {
        const name = t.description || 'Payment'
        if (!acc[name]) {
          acc[name] = { name, revenue: 0, count: 0 }
        }
        acc[name].revenue += t.amount
        acc[name].count += 1
        return acc
      }, {})

      const topProducts = Object.values(productMap)
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 4)

      setReportData({
        revenue,
        paymentMethods,
        topProducts,
        customerSegments,
        totalRevenue: revenue.reduce((sum: any, d: any) => sum + d.amount, 0),
        totalTransactions: revenue.reduce((sum: any, d: any) => sum + d.transactions, 0),
        totalCustomers: customers.length
      })
    } catch (error) {
      console.error('Failed to load report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = (format: 'csv' | 'pdf') => {
    // Export report
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const data = reportData || {
    revenue: [],
    paymentMethods: [],
    topProducts: [],
    customerSegments: [],
    totalRevenue: 0,
    totalTransactions: 0,
    totalCustomers: 0
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">Detailed insights and exportable reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <select 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
                <option value="custom">Custom range</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <select 
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="revenue">Revenue Report</option>
                <option value="transactions">Transaction Report</option>
                <option value="customers">Customer Report</option>
                <option value="products">Product Report</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Method</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="all">All Methods</option>
                <option value="orange_money">Orange Money</option>
                <option value="afrimoney">Afrimoney</option>
                <option value="qmoney">QMoney</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="all">All Status</option>
                <option value="successful">Successful</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.totalTransactions} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Transaction</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.totalTransactions > 0 ? data.totalRevenue / data.totalTransactions : 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per transaction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalCustomers}</div>
            <p className="text-xs text-muted-foreground mt-1">Active customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {data.revenue.length > 1 
                ? (((data.revenue[data.revenue.length - 1].amount - data.revenue[0].amount) / data.revenue[0].amount) * 100).toFixed(1) + '%'
                : '0%'
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">vs previous period</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.revenue}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tickFormatter={(value) => `SLE ${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => [formatCurrency(value), 'Revenue']} />
                <Line type="monotone" dataKey="amount" stroke="url(#gradient)" strokeWidth={2} />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Methods Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.paymentMethods}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ method, percentage }) => `${method} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {data.paymentMethods.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [formatCurrency(value), 'Amount']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Products/Services</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.topProducts.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No products/services yet</p>
            ) : (
              data.topProducts.map((product: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">{product.count} transactions</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(product.revenue)}</div>
                    <Badge variant="success">Top performer</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customer Segments</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.customerSegments}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="segment" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="url(#barGradient)" />
              <defs>
                <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Detailed Transaction Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium text-sm">Date</th>
                  <th className="text-left p-4 font-medium text-sm">Transactions</th>
                  <th className="text-left p-4 font-medium text-sm">Revenue</th>
                  <th className="text-left p-4 font-medium text-sm">Avg. Amount</th>
                  <th className="text-left p-4 font-medium text-sm">Growth</th>
                </tr>
              </thead>
              <tbody>
                {data.revenue.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-muted-foreground">No data available</td>
                  </tr>
                ) : (
                  data.revenue.map((day: any, index: number) => {
                    const prevDay = index > 0 ? data.revenue[index - 1] : null
                    const growth = prevDay ? ((day.amount - prevDay.amount) / prevDay.amount * 100).toFixed(1) : '0'
                    
                    return (
                      <tr key={day.date} className="border-b hover:bg-muted/50">
                        <td className="p-4">{formatDate(new Date(day.date))}</td>
                        <td className="p-4">{day.transactions}</td>
                        <td className="p-4 font-medium">{formatCurrency(day.amount)}</td>
                        <td className="p-4">{formatCurrency(day.transactions > 0 ? day.amount / day.transactions : 0)}</td>
                        <td className="p-4">
                          <span className={parseFloat(growth) >= 0 ? 'text-green-500' : 'text-red-500'}>
                            {parseFloat(growth) >= 0 ? '+' : ''}{growth}%
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
