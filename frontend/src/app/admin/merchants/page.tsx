'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Search, MoreVertical, Eye, Ban, CheckCircle, XCircle, Clock, Loader2, Building2, Mail, Phone, Calendar } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import { AdvancedFilter, FilterConfig } from '@/components/ui/AdvancedFilter'
import { ExportButton } from '@/components/ui/ExportButton'
import { api } from '@/lib/api'

interface Merchant {
  id: string
  userId: string
  businessName: string
  businessType: string
  businessAddress?: string
  phoneNumber?: string
  balance: number
  pendingBalance: number
  totalSettled: number
  kycStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW'
  verified: boolean
  email: string
  createdAt: Date
}

export default function AdminMerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Record<string, any>>({
    search: '',
    kycStatus: '',
    verified: '',
  })
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null)

  useEffect(() => {
    loadMerchants()
  }, [])

  const loadMerchants = async () => {
    try {
      const data = await api.getUsers()
      const users = Array.isArray(data) ? data : (data as any).users || []
      
      // Filter only merchants and map to merchant data
      const merchantsData = users
        .filter((u: any) => u.role === 'MERCHANT' && u.merchant)
        .map((u: any) => ({
          id: u.merchant.id,
          userId: u.id,
          businessName: u.merchant.businessName,
          businessType: u.merchant.businessType,
          businessAddress: u.merchant.businessAddress,
          phoneNumber: u.merchant.phoneNumber,
          balance: u.merchant.balance || 0,
          pendingBalance: u.merchant.pendingBalance || 0,
          totalSettled: u.merchant.totalSettled || 0,
          kycStatus: u.kycStatus || 'PENDING',
          verified: u.verified || false,
          email: u.email,
          createdAt: u.createdAt,
        }))
      
      setMerchants(merchantsData)
    } catch (error) {
      console.error('Failed to load merchants:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMerchants = merchants.filter(merchant => {
    const matchesSearch = !filters.search || 
      merchant.businessName.toLowerCase().includes(filters.search.toLowerCase()) ||
      merchant.email.toLowerCase().includes(filters.search.toLowerCase())

    const matchesKYC = !filters.kycStatus || merchant.kycStatus === filters.kycStatus
    const matchesVerified = !filters.verified || 
      (filters.verified === 'verified' && merchant.verified) ||
      (filters.verified === 'unverified' && !merchant.verified)

    return matchesSearch && matchesKYC && matchesVerified
  })

  const filterConfigs: FilterConfig[] = [
    {
      id: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Search by business name or email...',
    },
    {
      id: 'kycStatus',
      label: 'KYC Status',
      type: 'select',
      options: [
        { label: 'Approved', value: 'APPROVED' },
        { label: 'Pending', value: 'PENDING' },
        { label: 'Rejected', value: 'REJECTED' },
        { label: 'Under Review', value: 'UNDER_REVIEW' },
      ],
    },
    {
      id: 'verified',
      label: 'Verification',
      type: 'select',
      options: [
        { label: 'Verified', value: 'verified' },
        { label: 'Unverified', value: 'unverified' },
      ],
    },
  ]

  const exportColumns = [
    { key: 'id', label: 'Merchant ID' },
    { key: 'businessName', label: 'Business Name' },
    { key: 'businessType', label: 'Business Type' },
    { key: 'email', label: 'Email' },
    { key: 'phoneNumber', label: 'Phone' },
    { key: 'kycStatus', label: 'KYC Status' },
    { key: 'verified', label: 'Verified', format: (value: boolean) => value ? 'Yes' : 'No' },
    { key: 'balance', label: 'Balance', format: formatCurrency },
    { key: 'totalSettled', label: 'Total Settled', format: formatCurrency },
    { key: 'createdAt', label: 'Joined', format: formatDate },
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
        <h1 className="text-3xl font-bold">Merchants</h1>
        <p className="text-muted-foreground">Manage merchant accounts</p>
      </div>

      <AdvancedFilter
        filters={filterConfigs}
        onFilterChange={setFilters}
        onReset={() => setFilters({
          search: '',
          kycStatus: '',
          verified: '',
        })}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Merchants ({filteredMerchants.length})</CardTitle>
          <ExportButton
            data={filteredMerchants}
            columns={exportColumns}
            filename="merchants"
            title="Merchants Report"
            subtitle={`Showing ${filteredMerchants.length} merchants`}
            variant="dropdown"
            size="sm"
          />
        </CardHeader>
        <CardContent>
          {filteredMerchants.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No merchants registered yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium text-sm">Business</th>
                    <th className="text-left p-4 font-medium text-sm">Contact</th>
                    <th className="text-left p-4 font-medium text-sm">KYC Status</th>
                    <th className="text-left p-4 font-medium text-sm">Verified</th>
                    <th className="text-left p-4 font-medium text-sm">Balance</th>
                    <th className="text-left p-4 font-medium text-sm">Joined</th>
                    <th className="text-left p-4 font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMerchants.map((merchant) => (
                    <tr key={merchant.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{merchant.businessName}</div>
                            <div className="text-sm text-muted-foreground">{merchant.businessType}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <div>{merchant.email}</div>
                        </div>
                        {merchant.phoneNumber && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            {merchant.phoneNumber}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <Badge variant={
                          merchant.kycStatus === 'APPROVED' ? 'success' :
                          merchant.kycStatus === 'REJECTED' ? 'destructive' :
                          merchant.kycStatus === 'UNDER_REVIEW' ? 'secondary' :
                          'warning'
                        }>
                          {merchant.kycStatus}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant={merchant.verified ? 'success' : 'destructive'}>
                          {merchant.verified ? 'Yes' : 'No'}
                        </Badge>
                      </td>
                      <td className="p-4 font-medium">{formatCurrency(merchant.balance)}</td>
                      <td className="p-4 text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(merchant.createdAt)}
                      </td>
                      <td className="p-4">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedMerchant(merchant)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedMerchant && (
        <MerchantDetailModal
          merchant={selectedMerchant}
          onClose={() => setSelectedMerchant(null)}
        />
      )}
    </div>
  )
}

function MerchantDetailModal({
  merchant,
  onClose
}: {
  merchant: Merchant
  onClose: () => void
}) {
  return (
    <Modal isOpen={!!merchant} onClose={onClose} title="Merchant Details" size="lg">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Business Name</div>
              <div className="font-semibold">{merchant.businessName}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Business Type</div>
              <div className="font-semibold">{merchant.businessType}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Email</div>
              <div className="font-semibold flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {merchant.email}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Phone</div>
              <div className="font-semibold flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {merchant.phoneNumber || 'Not provided'}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Balance</div>
              <div className="text-2xl font-bold">{formatCurrency(merchant.balance)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Pending Balance</div>
              <div className="text-2xl font-bold">{formatCurrency(merchant.pendingBalance)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Total Settled</div>
              <div className="text-2xl font-bold">{formatCurrency(merchant.totalSettled)}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">KYC Status</div>
              <div className="font-semibold">
                <Badge variant={
                  merchant.kycStatus === 'APPROVED' ? 'success' :
                  merchant.kycStatus === 'REJECTED' ? 'destructive' :
                  merchant.kycStatus === 'UNDER_REVIEW' ? 'secondary' :
                  'warning'
                }>
                  {merchant.kycStatus}
                </Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Email Verified</div>
              <div className="font-semibold">
                <Badge variant={merchant.verified ? 'success' : 'destructive'}>
                  {merchant.verified ? 'Yes' : 'No'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1">
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve KYC
          </Button>
          <Button variant="outline" className="flex-1">
            <XCircle className="h-4 w-4 mr-2" />
            Reject KYC
          </Button>
          <Button variant="destructive" className="flex-1">
            <Ban className="h-4 w-4 mr-2" />
            Suspend Account
          </Button>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  )
}
