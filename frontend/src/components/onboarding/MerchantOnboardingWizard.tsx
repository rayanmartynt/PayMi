'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Building2, FileText, Upload, CheckCircle, AlertCircle, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'

interface OnboardingStep {
  id: string
  title: string
  description: string
}

const steps: OnboardingStep[] = [
  { id: 'business_info', title: 'Business Information', description: 'Tell us about your business' },
  { id: 'kyc_tier', title: 'KYC Requirements', description: 'Select your verification tier' },
  { id: 'upload_docs', title: 'Upload Documents', description: 'Upload required documents' },
  { id: 'review', title: 'Review & Submit', description: 'Review your information' },
]

export default function MerchantOnboardingWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [kycTier, setKycTier] = useState<'TIER_1' | 'TIER_2' | 'TIER_3'>('TIER_1')
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({})
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    businessAddress: '',
    taxId: '',
  })

  const kycTierInfo = {
    TIER_1: {
      name: 'Solo Merchant',
      description: 'For individual freelancers and sole proprietors',
      documents: ['Government ID (Passport/Driver\'s License)', 'Proof of Address (Utility bill)'],
    },
    TIER_2: {
      name: 'Business Entity',
      description: 'For registered companies and corporations',
      documents: [
        'Government ID',
        'Proof of Address',
        'Certificate of Incorporation',
        'Memorandum of Association',
        'Director\'s Resolution',
      ],
    },
    TIER_3: {
      name: 'High-Volume Business',
      description: 'For businesses with high transaction volumes',
      documents: [
        'All Tier 2 documents',
        'Ultimate Beneficial Ownership (UBO) Disclosure',
      ],
    },
  }

  const handleNext = () => {
    setError('')
    if (currentStep === 0) {
      if (!formData.businessName || !formData.businessType || !formData.businessAddress) {
        setError('Please fill in all required fields')
        return
      }
      setCurrentStep(1)
    } else if (currentStep === 1) {
      setCurrentStep(2)
    } else if (currentStep === 2) {
      const requiredDocs = kycTierInfo[kycTier].documents
      const uploadedCount = Object.keys(uploadedFiles).length
      if (uploadedCount < requiredDocs.length) {
        setError(`Please upload all ${requiredDocs.length} required documents (${uploadedCount} uploaded)`)
        return
      }
      setCurrentStep(3)
    } else if (currentStep === 3) {
      handleSubmit()
    }
  }

  const handleBack = () => {
    setError('')
    setCurrentStep(Math.max(0, currentStep - 1))
  }

  const handleFileUpload = (docType: string, file: File) => {
    setUploadedFiles(prev => ({ ...prev, [docType]: file }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // Update merchant profile
      await api.updateMerchantProfile({
        businessName: formData.businessName,
        businessType: formData.businessType,
        businessAddress: formData.businessAddress,
        kycTier,
      })

      // Upload documents
      for (const [docType, file] of Object.entries(uploadedFiles)) {
        const formData = new FormData()
        formData.append('document', file)
        formData.append('documentType', docType)
        await api.uploadKYCDocument(formData)
      }

      // Update onboarding step
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to complete onboarding')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Merchant Onboarding
          </h1>
          <p className="text-muted-foreground mt-2">Complete your business verification</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <CardTitle>{steps[currentStep].title}</CardTitle>
              <Badge variant="outline">Step {currentStep + 1} of {steps.length}</Badge>
            </div>
            <CardDescription>{steps[currentStep].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-8">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    index <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {index < currentStep ? <CheckCircle className="h-4 w-4" /> : index + 1}
                  </div>
                  {index < steps.length - 1 && <div className={`flex-1 h-1 mx-2 ${index < currentStep ? 'bg-primary' : 'bg-muted'}`} />}
                </div>
              ))}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {currentStep === 0 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Business Name *</label>
                  <Input
                    placeholder="Your Business Name"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Business Type *</label>
                  <select
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  >
                    <option value="">Select business type</option>
                    <option value="retail">Retail</option>
                    <option value="ecommerce">E-commerce</option>
                    <option value="services">Services</option>
                    <option value="technology">Technology</option>
                    <option value="food">Food & Beverage</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Business Address *</label>
                  <Input
                    placeholder="123 Main Street, Freetown"
                    value={formData.businessAddress}
                    onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Tax ID (Optional)</label>
                  <Input
                    placeholder="SL123456789"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  />
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(kycTierInfo).map(([tier, info]) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setKycTier(tier as any)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        kycTier === tier
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-border hover:border-primary/50 hover:shadow-sm'
                      }`}
                    >
                      <div className="font-semibold mb-1">{info.name}</div>
                      <div className="text-sm text-muted-foreground mb-2">{info.description}</div>
                      <div className="text-xs text-muted-foreground">{info.documents.length} documents required</div>
                    </button>
                  ))}
                </div>

                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Required Documents:</h4>
                  <ul className="space-y-1 text-sm">
                    {kycTierInfo[kycTier].documents.map((doc, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {doc}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                {kycTierInfo[kycTier].documents.map((doc, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{doc}</span>
                      </div>
                      {uploadedFiles[doc] ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Upload className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(doc, file)
                      }}
                      className="w-full text-sm"
                    />
                  </div>
                ))}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Business Name</div>
                    <div className="font-medium">{formData.businessName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Business Type</div>
                    <div className="font-medium">{formData.businessType}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Business Address</div>
                    <div className="font-medium">{formData.businessAddress}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">KYC Tier</div>
                    <div className="font-medium">{kycTierInfo[kycTier].name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Documents Uploaded</div>
                    <div className="font-medium">{Object.keys(uploadedFiles).length} / {kycTierInfo[kycTier].documents.length}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between gap-3 mt-6">
              <Button
                type="button"
                onClick={handleBack}
                variant="outline"
                disabled={currentStep === 0 || loading}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                type="button"
                onClick={handleNext}
                variant="gradient"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : currentStep === steps.length - 1 ? (
                  <>
                    Complete Onboarding
                    <CheckCircle className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
