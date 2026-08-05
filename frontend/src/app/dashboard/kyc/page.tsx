'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Upload, ShieldCheck, AlertCircle, CheckCircle, FileText, User, Building2, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { api } from '@/lib/api'

export default function KYCPage() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [documentType, setDocumentType] = useState<'ID_CARD' | 'PASSPORT' | 'BUSINESS_CERT'>('ID_CARD')
  const [merchant, setMerchant] = useState<any>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [merchantData, documentsData] = await Promise.all([
        api.getMerchantProfile(),
        api.getKYCDocuments()
      ])
      setMerchant(merchantData)
      setDocuments(Array.isArray(documentsData) ? documentsData : (documentsData as any).documents || [])
    } catch (error) {
      console.error('Failed to load KYC data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const kycStatus = merchant?.kycStatus || 'pending'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">KYC Verification</h1>
          <p className="text-muted-foreground">Complete your identity verification</p>
        </div>
        <Button onClick={() => setIsUploadModalOpen(true)} variant="gradient">
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Verification Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`h-16 w-16 rounded-full flex items-center justify-center ${
              kycStatus === 'approved' ? 'bg-green-100 dark:bg-green-900/30' :
              kycStatus === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
              'bg-red-100 dark:bg-red-900/30'
            }`}>
              {kycStatus === 'approved' ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : kycStatus === 'pending' ? (
                <AlertCircle className="h-8 w-8 text-yellow-500" />
              ) : (
                <AlertCircle className="h-8 w-8 text-red-500" />
              )}
            </div>
            <div>
              <div className="text-2xl font-bold capitalize">{kycStatus}</div>
              <p className="text-muted-foreground">
                {kycStatus === 'approved' 
                  ? 'Your account is fully verified' 
                  : kycStatus === 'pending'
                  ? 'Your documents are under review'
                  : 'Please complete verification to access all features'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {documents.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No documents uploaded yet</p>
            ) : (
              documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <div className="font-semibold">{doc.documentType}</div>
                      <div className="text-sm text-muted-foreground">
                        Submitted {formatDate(doc.createdAt)}
                        {doc.reviewedAt && ` • Reviewed ${formatDate(doc.reviewedAt)}`}
                      </div>
                    </div>
                  </div>
                  <Badge variant={doc.status === 'APPROVED' ? 'success' : doc.status === 'PENDING' ? 'warning' : 'destructive'}>
                    {doc.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Required Documents</CardTitle>
          <CardDescription>Upload the following documents to complete verification</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <User className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <div className="font-medium">National ID / Passport / Driver's License</div>
                <div className="text-sm text-muted-foreground">Proof of identity</div>
              </div>
              {documents.some(d => ['ID_CARD', 'PASSPORT'].includes(d.documentType)) ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <div className="font-medium">Business Registration Certificate</div>
                <div className="text-sm text-muted-foreground">Proof of business registration</div>
              </div>
              {documents.some(d => d.documentType === 'BUSINESS_CERT') ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false)
          loadData()
        }}
        documentType={documentType}
        setDocumentType={setDocumentType}
      />
    </div>
  )
}

function UploadModal({
  isOpen,
  onClose,
  documentType,
  setDocumentType
}: {
  isOpen: boolean
  onClose: () => void
  documentType: 'ID_CARD' | 'PASSPORT' | 'BUSINESS_CERT'
  setDocumentType: (type: 'ID_CARD' | 'PASSPORT' | 'BUSINESS_CERT') => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file size (5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB')
        setFile(null)
        return
      }
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Only JPEG, JPG, PNG, and PDF files are allowed')
        setFile(null)
        return
      }
      setFile(selectedFile)
      setError('')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
      if (!allowedTypes.includes(droppedFile.type)) {
        setError('Only JPEG, JPG, PNG, and PDF files are allowed')
        return
      }
      if (droppedFile.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB')
        return
      }
      setFile(droppedFile)
      setError('')
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!file) {
      setError('Please select a file to upload')
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('document', file)
      formData.append('documentType', documentType)

      await api.uploadKYCDocument(formData)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to upload document')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Document" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Document Type</label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value as any)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="ID_CARD">National ID</option>
            <option value="PASSPORT">Passport</option>
            <option value="BUSINESS_CERT">Business Registration Certificate</option>
          </select>
        </div>

        <div
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleFileSelect}
          />
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          {file ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-2">
                Drag and drop your document here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Supported formats: PDF, JPG, PNG (Max 5MB)
              </p>
            </>
          )}
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Note:</strong> Documents must be clear, valid, and not expired. Processing may take 1-3 business days.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="gradient" disabled={loading || !file}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload Document'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
