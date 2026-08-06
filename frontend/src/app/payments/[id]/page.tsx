'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { CopyButton } from '@/components/ui/CopyButton'
import { QRCodeSVG } from 'qrcode.react'
import { 
  Smartphone, 
  ArrowRight, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2,
  Shield,
  Lock,
  ArrowLeft
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

const paymentMethods = [
  { id: 'orange_money', name: 'Orange Money', icon: '/orange-money.png', color: 'from-orange-500 to-orange-600' },
  { id: 'afrimoney', name: 'Afrimoney', icon: '/afrimoney.png', color: 'from-purple-500 to-purple-600' },
  { id: 'qmoney', name: 'QMoney', icon: '/qmoney.jpg', color: 'from-orange-500 to-orange-600' },
]

export default function PaymentLinkPage({ params }: { params: Promise<{ id: string }> }) {
  const [step, setStep] = useState<'details' | 'payment' | 'processing' | 'success' | 'failed'>('details')
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)

  useEffect(() => {
    params.then(p => setResolvedParams(p))
  }, [params])

  if (!resolvedParams) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  // Mock payment link data
  const paymentLink = {
    id: resolvedParams.id,
    amount: 50000,
    currency: 'SLE',
    description: 'Premium subscription',
    merchantName: 'Tech Solutions SL',
    merchantLogo: '🔷',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
  }

  const handlePayment = () => {
    setStep('processing')
    setLoading(true)
    // Simulate payment processing
    setTimeout(() => {
      setLoading(false)
      setStep('success')
    }, 3000)
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-900/20 dark:to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-2xl border-green-200 dark:border-green-800">
            <CardContent className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.5, delay: 0.2 }}
              >
                <div className="mx-auto h-24 w-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
                <h2 className="text-3xl font-bold mb-2 text-green-600 dark:text-green-400">Payment Successful!</h2>
                <p className="text-muted-foreground mb-6">
                  Your payment has been processed successfully
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-3 mb-6 text-left bg-muted/50 p-4 rounded-lg"
              >
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-semibold">{formatCurrency(paymentLink.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Merchant</span>
                  <span>{paymentLink.merchantName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Description</span>
                  <span>{paymentLink.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transaction ID</span>
                  <span className="font-mono text-sm">TXN_{Date.now().toString(36).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span>{formatDate(new Date())}</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Button className="w-full" variant="gradient" size="lg">
                  Done
                </Button>
                <p className="text-xs text-muted-foreground mt-4">
                  A receipt has been sent to your email
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  if (step === 'failed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-red-900/20 dark:to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-2xl border-red-200 dark:border-red-800">
            <CardContent className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.5, delay: 0.2 }}
              >
                <div className="mx-auto h-24 w-24 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
                  <XCircle className="h-12 w-12 text-red-500" />
                </div>
                <h2 className="text-3xl font-bold mb-2 text-red-600 dark:text-red-400">Payment Failed</h2>
                <p className="text-muted-foreground mb-6">
                  We couldn't process your payment. Please try again.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-3"
              >
                <Button 
                  className="w-full" 
                  variant="gradient" 
                  size="lg"
                  onClick={() => setStep('payment')}
                >
                  Try Again
                </Button>
                <Link href="/">
                  <Button variant="outline" className="w-full" size="lg">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Return to Merchant
                  </Button>
                </Link>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-2xl">
            <CardContent className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.5 }}
              >
                <div className="mx-auto h-24 w-24 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6">
                  {loading ? (
                    <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
                  ) : (
                    <Clock className="h-12 w-12 text-blue-500" />
                  )}
                </div>
                <h2 className="text-2xl font-bold mb-2">Processing Payment</h2>
                <p className="text-muted-foreground">
                  Please wait while we process your payment...
                </p>
                <div className="mt-6 w-full bg-muted rounded-full h-2">
                  <motion.div
                    className="bg-primary h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 3 }}
                  />
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {paymentLink.merchantName}
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="shadow-2xl mb-6">
              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-2xl">
                    {paymentLink.merchantLogo}
                  </div>
                  <div className="text-left">
                    <CardTitle className="text-xl">{paymentLink.merchantName}</CardTitle>
                    <CardDescription>Secure Payment</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-2">Amount to Pay</div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {formatCurrency(paymentLink.amount)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">{paymentLink.description}</div>
                </div>

                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span>Secured by PayMi</span>
                  <Lock className="h-4 w-4 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl">
              <CardContent className="p-6">
                <AnimatePresence mode="wait">
                  {step === 'details' && (
                    <motion.div
                      key="details"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <h3 className="font-semibold text-lg">Your Information</h3>
                      
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Full Name</label>
                          <Input placeholder="Jane Smith" />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Email Address</label>
                          <Input type="email" placeholder="jane@example.com" />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Phone Number</label>
                          <Input type="tel" placeholder="+232 76 123 456" />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Expires {formatDate(paymentLink.expiresAt)}
                      </div>

                      <Button 
                        className="w-full" 
                        variant="gradient" 
                        size="lg"
                        onClick={() => setStep('payment')}
                      >
                        Continue to Payment
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </motion.div>
                  )}

                  {step === 'payment' && (
                    <motion.div
                      key="payment"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-6"
                    >
                      <div>
                        <h3 className="font-semibold text-lg mb-4">Select Payment Method</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {paymentMethods.map((method) => (
                            <button
                              key={method.id}
                              onClick={() => setSelectedMethod(method.id)}
                              className={`p-4 rounded-xl border-2 text-left transition-all ${
                                selectedMethod === method.id
                                  ? 'border-primary bg-primary/5 shadow-md'
                                  : 'border-border hover:border-primary/50 hover:shadow-md'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`h-12 w-12 rounded-xl bg-gradient-to-r ${method.color} flex items-center justify-center overflow-hidden shadow-sm`}>
                                  {method.icon.startsWith('/') ? (
                                    <img src={method.icon} alt={method.name} className="h-10 w-10 object-contain" />
                                  ) : (
                                    <span className="text-2xl">{method.icon}</span>
                                  )}
                                </div>
                                <div>
                                  <div className="font-semibold">{method.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    Mobile Money
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => setStep('details')}
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Back
                        </Button>
                        <Button 
                          className="flex-1" 
                          variant="gradient"
                          onClick={handlePayment}
                          disabled={!selectedMethod}
                        >
                          Pay {formatCurrency(paymentLink.amount)}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>

                      <div className="text-center text-xs text-muted-foreground">
                        <p>By continuing, you agree to our Terms of Service</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            <div className="mt-6 text-center text-xs text-muted-foreground">
              <p>Powered by PayMi • Secure payments for Sierra Leone</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
