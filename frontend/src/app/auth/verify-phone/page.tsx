'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Phone, ArrowRight, AlertCircle, Loader2, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'

export default function VerifyPhonePage() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [resending, setResending] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const phoneNumber = searchParams.get('phone') || ''
  const tempToken = searchParams.get('tempToken') || ''
  const isDashboard = searchParams.get('dashboard') === 'true'

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isDashboard) {
        // Dashboard flow: user is already authenticated
        const response = await api.verifyPhoneDashboard(code)
        setSuccess(true)
        
        setTimeout(() => {
          router.push('/dashboard')
        }, 1500)
      } else {
        // Registration flow
        const response = await api.completeRegistrationPhone(tempToken, code)
        setSuccess(true)
        
        // Store tokens and redirect
        localStorage.setItem('token', response.token)
        localStorage.setItem('refreshToken', response.refreshToken)
        
        // Redirect based on user role
        setTimeout(() => {
          if (response.user.role === 'ADMIN') {
            router.push('/admin')
          } else if (response.user.role === 'MERCHANT') {
            router.push('/dashboard')
          } else {
            router.push('/customer')
          }
        }, 1500)
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setResending(true)

    try {
      if (isDashboard) {
        await api.sendPhoneVerification()
      } else {
        await api.sendPhoneVerification(phoneNumber)
      }
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to resend code')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6FAFD] via-[#B3CFE5]/30 to-[#4A7FA7]/15 dark:from-gray-900 dark:via-[#1A3D63]/30 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] mb-4">
              <Phone className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#44b75e] to-[#0b5ed7] bg-clip-text text-transparent">
              Verify Your Phone
            </h1>
            <p className="text-muted-foreground mt-2">
              Enter the 6-digit code sent to {phoneNumber}
            </p>
          </div>

          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>Phone Verification</CardTitle>
              <CardDescription>
                We've sent a verification code to your phone number
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerify} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
                  </div>
                )}

                {success && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-green-700 dark:text-green-400">
                      Code sent successfully!
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="code" className="text-sm font-medium">
                    Verification Code
                  </label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="123456"
                    maxLength={6}
                    className="text-center text-2xl tracking-widest"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    required
                    disabled={loading}
                  />
                </div>

                <Button type="submit" variant="gradient" className="w-full group" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify Phone
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="text-sm text-primary hover:underline disabled:opacity-50"
                  >
                    {resending ? (
                      <>
                        <Loader2 className="inline h-4 w-4 mr-1 animate-spin" />
                        Resending...
                      </>
                    ) : (
                      "Didn't receive a code? Resend"
                    )}
                  </button>
                </div>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Wrong phone number?{' '}
                <Link href="/auth/login" className="text-primary hover:underline">
                  Go back to login
                </Link>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
