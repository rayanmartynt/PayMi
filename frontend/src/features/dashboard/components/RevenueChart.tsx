'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface RevenueChartProps {
  data: { date: string; amount: number }[]
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[date.getMonth()]} ${date.getDate()}`
}

const formatFullDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="date" 
          className="text-xs"
          tickFormatter={formatDate}
        />
        <YAxis 
          className="text-xs"
          tickFormatter={(value) => `SLE ${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip 
          formatter={(value: number) => [`SLE ${value.toLocaleString('en-US')}`, 'Revenue']}
          labelFormatter={formatFullDate}
        />
        <Line 
          type="monotone" 
          dataKey="amount" 
          stroke="url(#gradient)" 
          strokeWidth={2}
          dot={false}
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </LineChart>
    </ResponsiveContainer>
  )
}
