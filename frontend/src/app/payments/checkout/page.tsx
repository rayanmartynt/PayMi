'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { ArrowLeft, Shield, Lock, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'

export default function CheckoutPage() {
  const [step, setStep] = useState<'details' | 'payment' | 'processing' | 'success' | 'failed'>('details')
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const paymentMethods = [
    { id: 'orange_money', name: 'Orange Money', icon: '/orange-money.png', color: 'from-orange-500 to-orange-600' },
    { id: 'afrimoney', name: 'Afrimoney', icon: '/afrimoney.png', color: 'from-purple-500 to-purple-600' },
    { id: 'qmoney', name: 'QMoney', icon: '/qmoney.jpg', color: 'from-orange-500 to-orange-600' },
  ]

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
      <div className="min-h-screen bg-muted/50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
            >
              <div className="mx-auto h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
              <p className="text-muted-foreground mb-6">
                Your payment of SLE 50,000 has been processed successfully.
              </p>
              <div className="space-y-2 mb-6 text-left">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Transaction ID</span>
                  <span className="font-mono">TXN_123456</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-semibold">{formatCurrency(50000)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span>Orange Money</span>
                </div>
              </div>
              <Button className="w-full" variant="gradient">
                Done
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'failed') {
    return (
      <div className="min-h-screen bg-muted/50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
            >
              <div className="mx-auto h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
                <XCircle className="h-10 w-10 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Payment Failed</h2>
              <p className="text-muted-foreground mb-6">
                We couldn't process your payment. Please try again.
              </p>
              <div className="space-y-3">
                <Button className="w-full" variant="gradient" onClick={() => setStep('payment')}>
                  Try Again
                </Button>
                <Button className="w-full" variant="outline">
                  Cancel
                </Button>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-muted/50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
            >
              <div className="mx-auto h-20 w-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6">
                {loading ? (
                  <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                ) : (
                  <Clock className="h-10 w-10 text-blue-500" />
                )}
              </div>
              <h2 className="text-2xl font-bold mb-2">Processing Payment</h2>
              <p className="text-muted-foreground">
                Please wait while we process your payment...
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Secure Checkout</CardTitle>
              <CardDescription>
                Complete your payment securely
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {step === 'details' && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <Input placeholder="Jane Smith" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input type="email" placeholder="jane@example.com" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone Number</label>
                    <Input type="tel" placeholder="+232 76 123 456" />
                  </div>

                  <Button className="w-full" variant="gradient" onClick={() => setStep('payment')}>
                    Continue to Payment
                  </Button>
                </motion.div>
              )}

              {step === 'payment' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="font-semibold mb-3">Select Payment Method</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {paymentMethods.map((method) => (
                        <button
                          key={method.id}
                          onClick={() => setSelectedMethod(method.id)}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${
                            selectedMethod === method.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-lg bg-gradient-to-r ${method.color} flex items-center justify-center overflow-hidden`}>
                              {method.icon.startsWith('/') ? (
                                <img src={method.icon} alt={method.name} className="h-8 w-8 object-contain" />
                              ) : (
                                <span className="text-xl">{method.icon}</span>
                              )}
                            </div>
                            <span className="font-medium">{method.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedMethod && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Mobile Money Number</label>
                        <Input placeholder="+232 76 123 456" />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">PIN</label>
                        <Input type="password" placeholder="••••" maxLength={4} />
                      </div>
                    </motion.div>
                  )}

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep('details')} className="flex-1">
                      Back
                    </Button>
                    <Button 
                      variant="gradient" 
                      onClick={handlePayment} 
                      disabled={!selectedMethod}
                      className="flex-1"
                    >
                      Pay Securely
                    </Button>
                  </div>
                </motion.div>
              )}

              <div className="flex items-center justify-center gap-4 pt-4 border-t text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  <span>PCI DSS Ready</span>
                </div>
                <div className="flex items-center gap-1">
                  <Lock className="h-4 w-4" />
                  <span>256-bit Encryption</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Premium Subscription</span>
                <span>{formatCurrency(50000)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Processing Fee</span>
                <span>{formatCurrency(750)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-3 border-t">
                <span>Total</span>
                <span>{formatCurrency(50750)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
