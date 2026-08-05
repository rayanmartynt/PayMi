'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ShieldCheck, CheckCircle, XCircle, Clock, FileText, User, Building2, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

interface KYCDocument {
  id: string
  merchantId: string
  merchant: {
    id: string
    businessName: string
    user: {
      email: string
      name: string
    }
  }
  documentType: string
  documentUrl: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  rejectionReason?: string
  createdAt: Date
  reviewedAt?: Date
}

export default function AdminKYCPage() {
  const [kycDocuments, setKycDocuments] = useState<KYCDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedKYC, setSelectedKYC] = useState<KYCDocument | null>(null)

  useEffect(() => {
    loadKYCDocuments()
  }, [])

  const loadKYCDocuments = async () => {
    try {
      const data = await api.getPendingKYC()
      setKycDocuments(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load KYC documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (documentId: string) => {
    try {
      await api.approveKYC(documentId)
      setSelectedKYC(null)
      loadKYCDocuments()
    } catch (error) {
      console.error('Failed to approve KYC:', error)
    }
  }

  const handleReject = async (documentId: string, reason: string) => {
    try {
      await api.rejectKYC(documentId, reason)
      setSelectedKYC(null)
      loadKYCDocuments()
    } catch (error) {
      console.error('Failed to reject KYC:', error)
    }
  }

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
        <h1 className="text-3xl font-bold">KYC Approvals</h1>
        <p className="text-muted-foreground">Review merchant identity verification requests</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kycDocuments.filter(k => k.status === 'PENDING').length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kycDocuments.filter(k => k.status === 'APPROVED').length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kycDocuments.filter(k => k.status === 'REJECTED').length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>KYC Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {kycDocuments.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No KYC documents to review</p>
            ) : (
              kycDocuments.map((kyc) => (
                <div key={kyc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-semibold">{kyc.merchant.businessName}</div>
                    <div className="text-sm text-muted-foreground">
                      {kyc.documentType} • {kyc.merchant.user.email}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Submitted {formatDate(kyc.createdAt)}
                      {kyc.reviewedAt && ` • Reviewed ${formatDate(kyc.reviewedAt)}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={
                      kyc.status === 'APPROVED' ? 'success' :
                      kyc.status === 'REJECTED' ? 'destructive' :
                      'warning'
                    }>
                      {kyc.status}
                    </Badge>
                    {kyc.status === 'PENDING' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedKYC(kyc)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Review
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {selectedKYC && (
        <KYCModal
          kyc={selectedKYC}
          onClose={() => setSelectedKYC(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  )
}

function KYCModal({
  kyc,
  onClose,
  onApprove,
  onReject
}: {
  kyc: KYCDocument
  onClose: () => void
  onApprove: (id: string) => void
  onReject: (id: string, reason: string) => void
}) {
  const [rejectionReason, setRejectionReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason')
      return
    }
    setLoading(true)
    onReject(kyc.id, rejectionReason)
  }

  const handleApprove = () => {
    setLoading(true)
    onApprove(kyc.id)
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000${kyc.documentUrl}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to download document')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `kyc-document-${kyc.id}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download error:', error)
      alert('Failed to download document')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Modal isOpen={!!kyc} onClose={onClose} title="Review KYC Document" size="lg">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Merchant</div>
              <div className="font-semibold">{kyc.merchant.businessName}</div>
              <div className="text-sm text-muted-foreground mt-2">Email</div>
              <div className="font-semibold">{kyc.merchant.user.email}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Document Type</div>
              <div className="font-semibold">{kyc.documentType}</div>
              <div className="text-sm text-muted-foreground mt-2">Status</div>
              <div className="font-semibold">{kyc.status}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Document Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Document preview would be displayed here
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? 'Downloading...' : 'Download Document'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2">
          <label className="text-sm font-medium">Rejection Reason (if rejecting)</label>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter rejection reason..."
            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={handleReject} disabled={loading}>
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
          <Button variant="gradient" className="flex-1" onClick={handleApprove} disabled={loading}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve
          </Button>
        </div>

        <div className="flex justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  )
}
