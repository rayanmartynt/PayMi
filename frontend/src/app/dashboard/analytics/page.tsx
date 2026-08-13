'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { api } from '@/lib/api';
import { Loader2, Download, Calendar, Filter, FileText, Table } from 'lucide-react';
import { toast } from 'sonner';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

const METRICS = [
  { id: 'revenue', label: 'Revenue', type: 'currency' },
  { id: 'transactions', label: 'Transactions', type: 'number' },
  { id: 'successRate', label: 'Success Rate', type: 'percentage' },
  { id: 'averageTransactionValue', label: 'Avg Transaction', type: 'currency' },
  { id: 'customerCount', label: 'Customer Count', type: 'number' },
  { id: 'refundRate', label: 'Refund Rate', type: 'percentage' },
];

const DATE_RANGES = [
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: '90d', label: 'Last 90 days' },
  { id: 'custom', label: 'Custom range' },
];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [showReportBuilder, setShowReportBuilder] = useState(false);
  const [reportConfig, setReportConfig] = useState({
    name: '',
    metrics: ['revenue', 'transactions'],
    dateRange: '30d',
    startDate: '',
    endDate: '',
    groupBy: 'day',
  });
  const [generatedReport, setGeneratedReport] = useState<any>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const data = await api.getAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      // Analytics endpoint may not be implemented yet, show empty state with defaults
      setAnalytics({
        totalRevenue: 0,
        transactionCount: 0,
        successRate: 0,
        averageTransactionValue: 0,
        dailyRevenue: [],
        paymentMethods: {},
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      // Generate report based on config
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/analytics/custom-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(reportConfig)
      });
      const data = await response.json();
      if (response.ok) {
        setGeneratedReport(data);
        toast.success('Report generated successfully');
      } else {
        toast.error(data.error || 'Failed to generate report');
      }
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleExportReport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/analytics/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...reportConfig,
          format,
          data: generatedReport
        })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `paymi-report-${reportConfig.name || 'custom'}.${format === 'excel' ? 'xlsx' : format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success(`Report exported as ${format.toUpperCase()}`);
      } else {
        toast.error('Failed to export report');
      }
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Track your performance and growth</p>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <p className="text-muted-foreground">No analytics data available yet. Start accepting payments to see your analytics.</p>
              </div>
            </CardContent>
          </Card>
        </div>
    );
  }

  const paymentMethods = analytics?.transactionsByMethod?.map((item: any) => ({
    method: item.method || 'Unknown',
    amount: item.amount || 0
  })) || [];

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Track your performance and growth</p>
          </div>
          <Button onClick={() => setShowReportBuilder(!showReportBuilder)}>
            <FileText className="h-4 w-4 mr-2" />
            {showReportBuilder ? 'Hide Report Builder' : 'Custom Report'}
          </Button>
        </div>

        {showReportBuilder && (
          <Card>
            <CardHeader>
              <CardTitle>Custom Report Builder</CardTitle>
              <CardDescription>Create custom reports with your preferred metrics and date ranges</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Report Name</label>
                  <Input 
                    placeholder="My Custom Report"
                    value={reportConfig.name}
                    onChange={(e) => setReportConfig({...reportConfig, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <select 
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={reportConfig.dateRange}
                    onChange={(e) => setReportConfig({...reportConfig, dateRange: e.target.value})}
                  >
                    {DATE_RANGES.map(range => (
                      <option key={range.id} value={range.id}>{range.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {reportConfig.dateRange === 'custom' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Date</label>
                    <Input 
                      type="date"
                      value={reportConfig.startDate}
                      onChange={(e) => setReportConfig({...reportConfig, startDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">End Date</label>
                    <Input 
                      type="date"
                      value={reportConfig.endDate}
                      onChange={(e) => setReportConfig({...reportConfig, endDate: e.target.value})}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Select Metrics</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {METRICS.map(metric => (
                    <label key={metric.id} className="flex items-center gap-2 p-2 border rounded-md cursor-pointer hover:bg-muted">
                      <input 
                        type="checkbox"
                        checked={reportConfig.metrics.includes(metric.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setReportConfig({...reportConfig, metrics: [...reportConfig.metrics, metric.id]});
                          } else {
                            setReportConfig({...reportConfig, metrics: reportConfig.metrics.filter(m => m !== metric.id)});
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{metric.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Group By</label>
                <select 
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={reportConfig.groupBy}
                  onChange={(e) => setReportConfig({...reportConfig, groupBy: e.target.value})}
                >
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                </select>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="gradient" 
                  onClick={handleGenerateReport} 
                  disabled={generatingReport || reportConfig.metrics.length === 0}
                  className="flex-1"
                >
                  {generatingReport ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Filter className="h-4 w-4 mr-2" />}
                  Generate Report
                </Button>
                {generatedReport && (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleExportReport('pdf')}>
                      <Download className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                    <Button variant="outline" onClick={() => handleExportReport('excel')}>
                      <Download className="h-4 w-4 mr-2" />
                      Excel
                    </Button>
                    <Button variant="outline" onClick={() => handleExportReport('csv')}>
                      <Download className="h-4 w-4 mr-2" />
                      CSV
                    </Button>
                  </div>
                )}
              </div>

              {generatedReport && (
                <div className="mt-4 p-4 bg-muted rounded-md">
                  <h4 className="font-medium mb-2">Report Preview</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Date</th>
                          {reportConfig.metrics.map(metricId => {
                            const metric = METRICS.find(m => m.id === metricId);
                            return <th key={metricId} className="text-left p-2">{metric?.label}</th>;
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {generatedReport.data?.map((row: any, index: number) => (
                          <tr key={index} className="border-b">
                            <td className="p-2">{row.date}</td>
                            {reportConfig.metrics.map(metricId => (
                              <td key={metricId} className="p-2">
                                {metricId === 'revenue' || metricId === 'averageTransactionValue' 
                                  ? formatCurrency(row[metricId])
                                  : metricId === 'successRate' || metricId === 'refundRate'
                                  ? `${row[metricId]}%`
                                  : row[metricId]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics?.revenue || 0)}</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.transactions || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.successRate?.toFixed(1) || '0.0'}%</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Transaction</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics?.averageTransactionValue || 0)}</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics?.dailyRevenue && analytics.dailyRevenue.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.dailyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-SL', { month: 'short', day: 'numeric' })}
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
              ) : (
                <div className="text-center py-12 text-muted-foreground">No revenue data available</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              {paymentMethods.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={paymentMethods}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ method, percent }) => `${method} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {paymentMethods.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [formatCurrency(value), 'Amount']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-muted-foreground">No payment method data available</div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Customer Growth</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.customerGrowth && analytics.customerGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.customerGrowth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-SL', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="customers" fill="url(#barGradient)" />
                  <defs>
                    <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground">No customer growth data available</div>
            )}
          </CardContent>
        </Card>
      </div>
  );
}
