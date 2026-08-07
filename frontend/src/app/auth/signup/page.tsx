'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { User, Mail, Phone, Building2, Lock, ArrowRight, CheckCircle, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useStore } from '@/store/useStore'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'

const businessTypes = [
  { id: 'retail', name: 'Retail', description: 'Physical stores and shops' },
  { id: 'ecommerce', name: 'E-commerce', description: 'Online stores and marketplaces' },
  { id: 'services', name: 'Services', description: 'Professional services' },
  { id: 'technology', name: 'Technology', description: 'Software and tech companies' },
  { id: 'food', name: 'Food & Beverage', description: 'Restaurants and food delivery' },
  { id: 'other', name: 'Other', description: 'Other business types' },
]

export default function SignupPage() {
  const [step, setStep] = useState(0) // Step 0: Account Type Selection
  const [accountType, setAccountType] = useState<'individual' | 'business' | ''>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedBusinessType, setSelectedBusinessType] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { login } = useStore()
  const router = useRouter()

  const [formData, setFormData] = useState({
    // Personal Info
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    
    // Business Info
    businessName: '',
    businessType: '',
    businessAddress: '',
    taxId: '',
    
    // Terms
    agreeToTerms: false,
    agreeToPrivacy: false,
  })

  const handleNext = () => {
    setError('')
    if (step === 0) {
      if (!accountType) {
        setError('Please select an account type')
        return
      }
      setStep(1)
    } else if (step === 1) {
      if (!formData.fullName || !formData.email || !formData.phone || !formData.password) {
        setError('Please fill in all required fields')
        return
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match')
        return
      }
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters')
        return
      }
      // Skip business info step if individual
      if (accountType === 'individual') {
        setStep(3)
      } else {
        setStep(2)
      }
    } else if (step === 2) {
      if (!formData.businessName || !formData.businessType || !formData.businessAddress) {
        setError('Please fill in all required fields')
        return
      }
      setStep(3)
    }
  }

  const handleBack = () => {
    setError('')
    if (step === 3 && accountType === 'individual') {
      // Skip business info step when going back for individual accounts
      setStep(1)
    } else {
      setStep(step - 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.agreeToTerms || !formData.agreeToPrivacy) {
      setError('Please agree to the terms and privacy policy')
      return
    }

    setLoading(true)

    try {
      console.log('Submitting registration with data:', {
        name: formData.fullName,
        email: formData.email,
        accountType,
        businessName: formData.businessName,
        businessType: formData.businessType,
        phone: formData.phone,
      })

      // Register the user
      if (accountType === 'business') {
        await api.register({
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
          phoneNumber: formData.phone,
          businessName: formData.businessName,
          businessType: formData.businessType,
        })
      } else {
        await api.register({
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
          phoneNumber: formData.phone,
        })
      }

      console.log('Registration successful, redirecting to verify-email')
      router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`)
    } catch (err: any) {
      console.error('Registration error:', err)
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-r from-blue-600 to-green-600 mb-4">
            <User className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Create Your Account
          </h1>
          <p className="text-muted-foreground mt-2">Start accepting payments in minutes</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <CardTitle>
                {step === 0 && 'Choose Your Account Type'}
                {step === 1 && 'Personal Information'}
                {step === 2 && 'Business Information'}
                {step === 3 && 'Review & Confirm'}
              </CardTitle>
              {step > 0 && <Badge variant="outline">Step {step} of {accountType === 'individual' ? 2 : 3}</Badge>}
            </div>
            <CardDescription>
              {step === 0 && 'Are you signing up as an individual or representing a business?'}
              {step === 1 && 'Tell us about yourself'}
              {step === 2 && 'Tell us about your business'}
              {step === 3 && 'Review and confirm'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Progress Steps */}
            {step > 0 && (
              <div className="flex items-center justify-between mb-8">
                {Array.from({ length: accountType === 'individual' ? 2 : 3 }, (_, i) => i + 1).map((s) => (
                  <div key={s} className="flex items-center flex-1">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      s <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      {s < step ? <CheckCircle className="h-4 w-4" /> : s}
                    </div>
                    {s < (accountType === 'individual' ? 2 : 3) && <div className={`flex-1 h-1 mx-2 ${s < step ? 'bg-primary' : 'bg-muted'}`} />}
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {step === 0 && (
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setAccountType('individual')}
                      className={`p-6 rounded-xl border-2 text-left transition-all ${
                        accountType === 'individual'
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-border hover:border-primary/50 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-4 mb-3">
                        <div className={`p-3 rounded-lg ${
                          accountType === 'individual' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}>
                          <User className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="font-semibold text-lg">Individual</div>
                          <div className="text-sm text-muted-foreground">Personal account</div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Send money, make payments, and manage your personal finances
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAccountType('business')}
                      className={`p-6 rounded-xl border-2 text-left transition-all ${
                        accountType === 'business'
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-border hover:border-primary/50 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-4 mb-3">
                        <div className={`p-3 rounded-lg ${
                          accountType === 'business' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}>
                          <Building2 className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="font-semibold text-lg">Business</div>
                          <div className="text-sm text-muted-foreground">Merchant account</div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Accept payments, manage customers, and grow your business
                      </p>
                    </button>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button type="button" onClick={handleNext} variant="gradient" disabled={!accountType}>
                      Continue
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Michael Kamara"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="michael@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="tel"
                      placeholder="+232 76 123 456"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Confirm Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between gap-3 pt-4">
                  <Button type="button" onClick={handleBack} variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button type="button" onClick={handleNext} variant="gradient" className="w-full sm:w-auto">
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
                </motion.div>
                </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="space-y-2">
                  <label className="text-sm font-medium">Business Name *</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Tech Solutions SL"
                      value={formData.businessName}
                      onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Business Type *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {businessTypes.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => {
                          setSelectedBusinessType(type.id)
                          setFormData({...formData, businessType: type.id})
                        }}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          formData.businessType === type.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="font-medium text-sm">{type.name}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Business Address *</label>
                  <Input
                    placeholder="123 Main Street, Freetown"
                    value={formData.businessAddress}
                    onChange={(e) => setFormData({...formData, businessAddress: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Tax ID (Optional)</label>
                  <Input
                    placeholder="SL123456789"
                    value={formData.taxId}
                    onChange={(e) => setFormData({...formData, taxId: e.target.value})}
                  />
                </div>

                <div className="flex justify-between gap-3 pt-4">
                  <Button type="button" onClick={handleBack} variant="outline">
                    Back
                  </Button>
                  <Button type="button" onClick={handleNext} variant="gradient">
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
                </motion.div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <div className="text-sm text-muted-foreground">Full Name</div>
                    <div className="font-medium">{formData.fullName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Email</div>
                    <div className="font-medium">{formData.email}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Phone</div>
                    <div className="font-medium">{formData.phone}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Business Name</div>
                    <div className="font-medium">{formData.businessName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Business Type</div>
                    <div className="font-medium">{businessTypes.find(t => t.id === formData.businessType)?.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Business Address</div>
                    <div className="font-medium">{formData.businessAddress}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.agreeToTerms}
                      onChange={(e) => setFormData({...formData, agreeToTerms: e.target.checked})}
                      className="mt-1 rounded"
                    />
                    <span className="text-sm">
                      I agree to the{' '}
                      <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
                    </span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.agreeToPrivacy}
                      onChange={(e) => setFormData({...formData, agreeToPrivacy: e.target.checked})}
                      className="mt-1 rounded"
                    />
                    <span className="text-sm">
                      I agree to the{' '}
                      <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                    </span>
                  </label>
                </div>

                <div className="flex justify-between gap-3 pt-4">
                  <Button type="button" onClick={handleBack} variant="outline">
                    Back
                  </Button>
                  <Button 
                    type="button" 
                    onClick={handleSubmit} 
                    variant="gradient"
                    disabled={loading}
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                    {!loading && <ArrowRight className="h-4 w-4 ml-2" />}
                  </Button>
                </div>
                </motion.div>
              </div>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-primary font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By creating an account, you agree to our{' '}
          <Link href="/terms" className="underline">Terms of Service</Link> and{' '}
          <Link href="/privacy" className="underline">Privacy Policy</Link>
        </p>
        </motion.div>
      </div>
    </div>
  )
}
