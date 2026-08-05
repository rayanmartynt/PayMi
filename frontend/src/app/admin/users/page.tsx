'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Search, MoreVertical, Eye, Ban, CheckCircle, XCircle, Shield, UserPlus, Settings, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import { AdvancedFilter, FilterConfig } from '@/components/ui/AdvancedFilter'
import { ExportButton } from '@/components/ui/ExportButton'
import { api } from '@/lib/api'

interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'MERCHANT' | 'CUSTOMER'
  kycStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW'
  verified: boolean
  createdAt: Date
  merchant?: {
    id: string
    businessName: string
    businessType: string
  }
  customer?: {
    id: string
  }
}


export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Record<string, any>>({
    search: '',
    role: '',
    status: '',
  })
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const data = await api.getUsers()
      setUsers(Array.isArray(data) ? data : (data as any).users || [])
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = !filters.search || 
      user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.email.toLowerCase().includes(filters.search.toLowerCase())

    const matchesRole = !filters.role || user.role === filters.role
    const matchesStatus = !filters.status || user.kycStatus === filters.status

    return matchesSearch && matchesRole && matchesStatus
  })

  const filterConfigs: FilterConfig[] = [
    {
      id: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Search by name or email...',
    },
    {
      id: 'role',
      label: 'Role',
      type: 'select',
      options: [
        { label: 'Admin', value: 'ADMIN' },
        { label: 'Merchant', value: 'MERCHANT' },
        { label: 'Customer', value: 'CUSTOMER' },
      ],
    },
    {
      id: 'status',
      label: 'KYC Status',
      type: 'select',
      options: [
        { label: 'Pending', value: 'PENDING' },
        { label: 'Approved', value: 'APPROVED' },
        { label: 'Rejected', value: 'REJECTED' },
        { label: 'Under Review', value: 'UNDER_REVIEW' },
      ],
    },
  ]

  const exportColumns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'kycStatus', label: 'KYC Status' },
    { key: 'verified', label: 'Verified', format: (value: boolean) => value ? 'Yes' : 'No' },
    { key: 'createdAt', label: 'Created', format: formatDate },
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage all merchants and customers</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Merchants</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter(u => u.role === 'MERCHANT').length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter(u => u.role === 'CUSTOMER').length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">KYC Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter(u => u.kycStatus === 'APPROVED').length}</div>
          </CardContent>
        </Card>
      </div>

      <AdvancedFilter
        filters={filterConfigs}
        onFilterChange={setFilters}
        onReset={() => setFilters({
          search: '',
          role: '',
          status: '',
        })}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Users ({filteredUsers.length})</CardTitle>
          <ExportButton
            data={filteredUsers}
            columns={exportColumns}
            filename="users"
            title="Users Report"
            subtitle={`Showing ${filteredUsers.length} users`}
            variant="dropdown"
            size="sm"
          />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium text-sm">User</th>
                  <th className="text-left p-4 font-medium text-sm">Role</th>
                  <th className="text-left p-4 font-medium text-sm">KYC Status</th>
                  <th className="text-left p-4 font-medium text-sm">Verified</th>
                  <th className="text-left p-4 font-medium text-sm">Business</th>
                  <th className="text-left p-4 font-medium text-sm">Created</th>
                  <th className="text-left p-4 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </td>
                    <td className="p-4">
                      <Badge variant={
                        user.role === 'ADMIN' ? 'destructive' :
                        user.role === 'MERCHANT' ? 'secondary' :
                        'outline'
                      }>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant={
                        user.kycStatus === 'APPROVED' ? 'success' :
                        user.kycStatus === 'PENDING' ? 'warning' :
                        user.kycStatus === 'UNDER_REVIEW' ? 'secondary' :
                        'destructive'
                      }>
                        {user.kycStatus}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant={user.verified ? 'success' : 'destructive'}>
                        {user.verified ? 'Yes' : 'No'}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {user.merchant?.businessName || '-'}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{formatDate(user.createdAt)}</td>
                    <td className="p-4">
                      <Button variant="ghost" size="icon" onClick={() => setSelectedUser(user)}>
                        <Settings className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selectedUser && (
        <UserModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  )
}

function UserModal({
  user,
  onClose
}: {
  user: User
  onClose: () => void
}) {
  return (
    <Modal isOpen={!!user} onClose={onClose} title="User Details" size="lg">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Name</div>
              <div className="font-semibold">{user.name}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Email</div>
              <div className="font-semibold">{user.email}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Role</div>
              <div className="font-semibold">{user.role}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">KYC Status</div>
              <div className="font-semibold">{user.kycStatus}</div>
            </CardContent>
          </Card>
        </div>

        {user.merchant && (
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Business Name</div>
              <div className="font-semibold">{user.merchant.businessName}</div>
              <div className="text-sm text-muted-foreground mt-2">Business Type</div>
              <div className="font-semibold">{user.merchant.businessType}</div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end">
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  )
}
