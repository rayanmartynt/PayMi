'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Code, Copy, Check, Zap, Shield, Globe, Smartphone } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

export default function ApiDocsPage() {
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const codeExamples = [
    {
      language: 'curl',
      code: `curl -X POST https://api.salonepay.com/v1/payments \\
  -H "Authorization: Bearer YOUR_SECRET_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 50000,
    "currency": "SLE",
    "payment_method": "orange_money",
    "customer": {
      "email": "customer@example.com",
      "phone": "+232 76 123 456",
      "name": "John Doe"
    }
  }'`
    },
    {
      language: 'javascript',
      code: `const response = await fetch('https://api.salonepay.com/v1/payments', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_SECRET_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 50000,
    currency: 'SLE',
    payment_method: 'orange_money',
    customer: {
      email: 'customer@example.com',
      phone: '+232 76 123 456',
      name: 'John Doe'
    }
  })
})

const payment = await response.json()`
    },
    {
      language: 'python',
      code: `import requests

response = requests.post(
    'https://api.salonepay.com/v1/payments',
    headers={
        'Authorization': 'Bearer YOUR_SECRET_KEY',
        'Content-Type': 'application/json'
    },
    json={
        'amount': 50000,
        'currency': 'SLE',
        'payment_method': 'orange_money',
        'customer': {
            'email': 'customer@example.com',
            'phone': '+232 76 123 456',
            'name': 'John Doe'
        }
    }
)

payment = response.json()`
    }
  ]

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-4">API Documentation</h1>
            <p className="text-xl text-muted-foreground">
              Integrate SalonePay into your application with our powerful REST API
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <Card>
              <CardHeader>
                <Zap className="h-8 w-8 text-blue-500 mb-2" />
                <CardTitle className="text-lg">Fast Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Get started in minutes with our simple REST API
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-green-500 mb-2" />
                <CardTitle className="text-lg">Secure</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Bank-level security with HMAC signature verification
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Globe className="h-8 w-8 text-purple-500 mb-2" />
                <CardTitle className="text-lg">Webhooks</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Real-time notifications for payment events
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Smartphone className="h-8 w-8 text-orange-500 mb-2" />
                <CardTitle className="text-lg">Mobile Money</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Full support for Orange Money, Afrimoney, QMoney
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Authentication</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                All API requests require authentication using your secret API key. Include it in the Authorization header:
              </p>
              <div className="bg-muted p-4 rounded-lg font-mono text-sm mb-4">
                Authorization: Bearer YOUR_SECRET_KEY
              </div>
              <p className="text-sm text-muted-foreground">
                Never expose your secret key in client-side code. Use your public key for client-side operations.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Accept a Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Create a payment to accept money from your customers.
              </p>
              
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Endpoint</h3>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                  POST /v1/payments
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-2">Request Body</h3>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                  {`{
  "amount": 50000,
  "currency": "SLE",
  "payment_method": "orange_money",
  "customer": {
    "email": "customer@example.com",
    "phone": "+232 76 123 456",
    "name": "John Doe"
  },
  "description": "Payment for order #123"
}`}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-2">Response</h3>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                  {`{
  "id": "pay_1234567890",
  "status": "pending",
  "amount": 50000,
  "currency": "SLE",
  "payment_method": "orange_money",
  "created_at": "2024-08-01T10:30:00Z"
}`}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Code Examples</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {codeExamples.map((example, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold capitalize">{example.language}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(example.code, example.language)}
                      >
                        {copied === example.language ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
                      <pre>{example.code}</pre>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Webhooks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Configure webhooks to receive real-time notifications about payment events.
              </p>
              
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Webhook Events</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>payment.successful - Payment completed successfully</li>
                  <li>payment.failed - Payment failed</li>
                  <li>payment.pending - Payment is pending</li>
                  <li>payment.refunded - Payment was refunded</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Webhook Payload</h3>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                  {`{
  "event": "payment.successful",
  "data": {
    "id": "pay_1234567890",
    "amount": 50000,
    "currency": "SLE",
    "status": "successful"
  },
  "timestamp": "2024-08-01T10:30:00Z"
}`}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Our support team is available to help you integrate SalonePay into your application.
              </p>
              <div className="flex gap-4">
                <Link href="/contact">
                  <Button variant="gradient">Contact Support</Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline">Get API Keys</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
