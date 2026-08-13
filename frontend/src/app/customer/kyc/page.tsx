'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function CustomerKYCPage() {
  const [documentType, setDocumentType] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const documentTypes = [
    { value: 'ID_CARD', label: 'ID Card', description: 'National ID card' },
    { value: 'PASSPORT', label: 'Passport', description: 'International passport' },
    { value: 'PROOF_OF_ADDRESS', label: 'Proof of Address', description: 'Utility bill or bank statement' }
  ]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB')
        return
      }
      if (!['image/jpeg', 'image/png', 'application/pdf'].includes(selectedFile.type)) {
        toast.error('Only JPEG, PNG, and PDF files are allowed')
        return
      }
      setFile(selectedFile)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !documentType) {
      toast.error('Please select a document type and file')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('document', file)
    formData.append('documentType', documentType)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/customer-kyc/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      toast.success('Document uploaded successfully')
      setFile(null)
      setDocumentType('')
      fetchDocuments()
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload document')
    } finally {
      setUploading(false)
    }
  }

  const fetchDocuments = async () => {
    try {
      const docs = await api.getCustomerKYCDocuments() as any[]
      setUploadedDocuments(docs)
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setLoading(false)
    }
  }

  useState(() => {
    fetchDocuments()
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'REJECTED':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'UNDER_REVIEW':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'NEEDS_INFO':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">KYC Verification</h1>
          <p className="text-muted-foreground mt-2">
            Complete your identity verification to access all features including transfers, withdrawals, and receiving money.
          </p>
        </div>

        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Documents</CardTitle>
            <CardDescription>
              Upload your identification documents for verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="documentType">Document Type</Label>
                <select
                  id="documentType"
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  required
                >
                  <option value="">Select document type</option>
                  {documentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label} - {type.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Document File</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                  <input
                    id="file"
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    required
                  />
                  <label htmlFor="file" className="cursor-pointer">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {file ? file.name : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      JPEG, PNG, or PDF (max 10MB)
                    </p>
                  </label>
                </div>
              </div>

              <Button type="submit" variant="gradient" className="w-full" disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Document
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Uploaded Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Your Documents</CardTitle>
            <CardDescription>
              Track the status of your uploaded documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : uploadedDocuments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No documents uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {uploadedDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{doc.documentType.replace('_', ' ')}</p>
                        <p className="text-sm text-muted-foreground">
                          Uploaded: {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                        {doc.rejectionReason && (
                          <p className="text-sm text-red-600 mt-1">
                            Reason: {doc.rejectionReason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(doc.status)}`}>
                      {doc.status.replace('_', ' ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Banner */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Why is KYC verification required?
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Transfer money to other customers</li>
                  <li>• Receive money from other customers</li>
                  <li>• Withdraw funds to your mobile money account</li>
                  <li>• Comply with regulatory requirements</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
