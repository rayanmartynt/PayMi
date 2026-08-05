'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { ArrowLeft, Mail, Shield, Loader2, CheckCircle } from 'lucide-react'
import { Navbar } from '@/components/landing/Navbar'
import { api } from '@/lib/api'

export default function VerifyEmailPage() {
  const router = useRouter()
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showEmailInput, setShowEmailInput] = useState(false)
  const [resendSuccess, setResendSuccess] = useState('')

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[0]
    }
    
    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`) as HTMLInputElement
      if (nextInput) {
        nextInput.focus()
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`) as HTMLInputElement
      if (prevInput) {
        prevInput.focus()
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    const verificationCode = code.join('')
    
    if (verificationCode.length !== 6) {
      setError('Please enter all 6 digits')
      return
    }

    setLoading(true)

    try {
      await api.verifyEmail(verificationCode)
      setSuccess(true)
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Invalid or expired verification code')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setResendSuccess('')
    
    if (!email) {
      setShowEmailInput(true)
      return
    }

    setLoading(true)
    
    try {
      await api.resendVerificationCode(email)
      setResendSuccess('New verification code sent successfully!')
      setTimeout(() => {
        setResendSuccess('')
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to resend code')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-muted/50">
        <Navbar />
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold">Email Verified!</h2>
                <p className="text-muted-foreground">
                  Your email has been successfully verified. Redirecting to login...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/50">
      <Navbar />
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Verify your email</CardTitle>
            <CardDescription>
              Enter the 6-digit code sent to your email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {showEmailInput && (
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="code" className="text-sm font-medium text-center block">
                  Verification Code
                </label>
                <div className="flex justify-center gap-2">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <Input
                      key={i}
                      id={`code-${i}`}
                      type="text"
                      maxLength={1}
                      value={code[i]}
                      onChange={(e) => handleCodeChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      className="w-12 h-12 text-center text-xl font-bold"
                      disabled={loading}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md text-center">
                  {error}
                </div>
              )}
              
              {resendSuccess && (
                <div className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm p-3 rounded-md text-center">
                  {resendSuccess}
                </div>
              )}

              <Button className="w-full" variant="gradient" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Email'
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Didn't receive the code?{' '}
              <button 
                onClick={handleResend}
                className="text-primary hover:underline"
                disabled={loading}
              >
                Resend
              </button>
            </p>

            <Link href="/auth/login" className="flex items-center justify-center text-sm text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to login
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
