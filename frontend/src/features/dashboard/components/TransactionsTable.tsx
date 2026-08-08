import { Transaction } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { CopyButton } from '@/components/ui/CopyButton'

interface TransactionsTableProps {
  transactions: Transaction[]
}

const statusColors = {
  successful: 'success',
  failed: 'destructive',
  pending: 'warning',
  refunded: 'secondary',
} as const

const paymentMethodIcons = {
  orange_money: '/orange-money.png',
  afrimoney: '/afrimoney.png',
  qmoney: '/qmoney.jpg',
  bank_transfer: '🏦',
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No transactions found
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-4 font-medium text-sm">Transaction ID</th>
            <th className="text-left p-4 font-medium text-sm">Customer</th>
            <th className="text-left p-4 font-medium text-sm">Amount</th>
            <th className="text-left p-4 font-medium text-sm">Method</th>
            <th className="text-left p-4 font-medium text-sm">Status</th>
            <th className="text-left p-4 font-medium text-sm">Date</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="border-b hover:bg-muted/50">
              <td className="p-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">{transaction.id}</span>
                  <CopyButton text={transaction.id} />
                </div>
              </td>
              <td className="p-4">
                <div>
                  <div className="font-medium">{transaction.customerName || 'N/A'}</div>
                  <div className="text-sm text-muted-foreground">{transaction.customerEmail || 'N/A'}</div>
                </div>
              </td>
              <td className="p-4 font-medium">{formatCurrency(transaction.amount)}</td>
              <td className="p-4">
                <div className="flex items-center gap-2">
                  {paymentMethodIcons[transaction.paymentMethod].startsWith('/') ? (
                    <img src={paymentMethodIcons[transaction.paymentMethod]} alt={transaction.paymentMethod} className="h-5 w-5 object-contain" />
                  ) : (
                    <span>{paymentMethodIcons[transaction.paymentMethod]}</span>
                  )}
                  <span className="capitalize">{transaction.paymentMethod.replace('_', ' ')}</span>
                </div>
              </td>
              <td className="p-4">
                <Badge variant={statusColors[transaction.status]}>
                  {transaction.status}
                </Badge>
              </td>
              <td className="p-4 text-sm text-muted-foreground">
                {formatDateTime(transaction.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
