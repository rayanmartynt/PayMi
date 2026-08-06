'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { 
  Code, 
  Copy, 
  CheckCircle, 
  Play, 
  Book, 
  Zap, 
  Shield, 
  ChevronRight,
  ChevronDown,
  Globe,
  Lock
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const apiEndpoints = [
  {
    category: 'Payments',
    endpoints: [
      {
        method: 'POST',
        path: '/v1/payments',
        description: 'Create a new payment',
        auth: true,
        request: {
          amount: 50000,
          currency: 'SLE',
          customer_email: 'customer@example.com',
          customer_phone: '+232 76 123 456',
          description: 'Premium subscription',
          payment_method: 'orange_money',
        },
        response: {
          id: 'pay_1234567890',
          status: 'pending',
          amount: 50000,
          currency: 'SLE',
          created_at: '2024-08-01T10:30:00Z',
          payment_url: 'https://PayMi.com/pay/pay_1234567890',
        },
      },
      {
        method: 'GET',
        path: '/v1/payments/:id',
        description: 'Retrieve payment details',
        auth: true,
        request: null,
        response: {
          id: 'pay_1234567890',
          status: 'successful',
          amount: 50000,
          currency: 'SLE',
          customer_email: 'customer@example.com',
          payment_method: 'orange_money',
          created_at: '2024-08-01T10:30:00Z',
          completed_at: '2024-08-01T10:32:00Z',
        },
      },
      {
        method: 'POST',
        path: '/v1/payments/:id/refund',
        description: 'Refund a payment',
        auth: true,
        request: {
          amount: 50000,
          reason: 'Customer request',
        },
        response: {
          id: 'ref_1234567890',
          payment_id: 'pay_1234567890',
          amount: 50000,
          status: 'processed',
          created_at: '2024-08-01T11:00:00Z',
        },
      },
    ],
  },
  {
    category: 'Customers',
    endpoints: [
      {
        method: 'POST',
        path: '/v1/customers',
        description: 'Create a customer',
        auth: true,
        request: {
          email: 'customer@example.com',
          name: 'John Doe',
          phone: '+232 76 123 456',
          metadata: {
            company: 'Acme Inc',
          },
        },
        response: {
          id: 'cust_1234567890',
          email: 'customer@example.com',
          name: 'John Doe',
          phone: '+232 76 123 456',
          created_at: '2024-08-01T10:00:00Z',
        },
      },
      {
        method: 'GET',
        path: '/v1/customers/:id',
        description: 'Retrieve customer details',
        auth: true,
        request: null,
        response: {
          id: 'cust_1234567890',
          email: 'customer@example.com',
          name: 'John Doe',
          phone: '+232 76 123 456',
          lifetime_value: 150000,
          total_payments: 3,
          created_at: '2024-08-01T10:00:00Z',
        },
      },
    ],
  },
  {
    category: 'Webhooks',
    endpoints: [
      {
        method: 'POST',
        path: '/v1/webhooks',
        description: 'Create webhook endpoint',
        auth: true,
        request: {
          url: 'https://your-site.com/webhook',
          events: ['payment.successful', 'payment.failed'],
          secret: 'whsec_1234567890',
        },
        response: {
          id: 'wh_1234567890',
          url: 'https://your-site.com/webhook',
          events: ['payment.successful', 'payment.failed'],
          status: 'active',
          created_at: '2024-08-01T10:00:00Z',
        },
      },
    ],
  },
]

const codeExamples = {
  curl: `curl -X POST https://api.PayMi.com/v1/payments \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 50000,
    "currency": "SLE",
    "customer_email": "customer@example.com",
    "customer_phone": "+232 76 123 456",
    "description": "Premium subscription",
    "payment_method": "orange_money"
  }'`,
  
  javascript: `const response = await fetch('https://api.PayMi.com/v1/payments', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    amount: 50000,
    currency: 'SLE',
    customer_email: 'customer@example.com',
    customer_phone: '+232 76 123 456',
    description: 'Premium subscription',
    payment_method: 'orange_money',
  }),
});

const payment = await response.json();
console.log(payment);`,

  python: `import requests

response = requests.post(
    'https://api.PayMi.com/v1/payments',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json',
    },
    json={
        'amount': 50000,
        'currency': 'SLE',
        'customer_email': 'customer@example.com',
        'customer_phone': '+232 76 123 456',
        'description': 'Premium subscription',
        'payment_method': 'orange_money',
    }
)

payment = response.json()
print(payment)`,

  php: `<?php
$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, 'https://api.PayMi.com/v1/payments');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer YOUR_API_KEY',
    'Content-Type: application/json',
]);

$data = [
    'amount' => 50000,
    'currency' => 'SLE',
    'customer_email' => 'customer@example.com',
    'customer_phone' => '+232 76 123 456',
    'description' => 'Premium subscription',
    'payment_method' => 'orange_money',
];

curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));

$response = curl_exec($ch);
curl_close($ch);

$payment = json_decode($response, true);
print_r($payment);
?>`,
}

export default function APIDocsPage() {
  const [selectedCategory, setSelectedCategory] = useState(0)
  const [selectedEndpoint, setSelectedEndpoint] = useState(0)
  const [selectedLanguage, setSelectedLanguage] = useState('javascript')
  const [copied, setCopied] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set([0]))

  const toggleCategory = (index: number) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const currentEndpoint = apiEndpoints[selectedCategory]?.endpoints[selectedEndpoint]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">API Documentation</h1>
        <p className="text-muted-foreground">Integrate PayMi into your application</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Version</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">v1.0</div>
            <p className="text-xs text-muted-foreground mt-1">Stable</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Base URL</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-mono">https://api.PayMi.com</div>
            <p className="text-xs text-muted-foreground mt-1">Production</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Authentication</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-mono">Bearer Token</div>
            <p className="text-xs text-muted-foreground mt-1">API Key required</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
              1
            </div>
            <div>
              <div className="font-medium">Get your API Key</div>
              <div className="text-sm text-muted-foreground">Navigate to API Keys in your dashboard to generate your credentials</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
              2
            </div>
            <div>
              <div className="font-medium">Make your first request</div>
              <div className="text-sm text-muted-foreground">Use the examples below to create your first payment</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
              3
            </div>
            <div>
              <div className="font-medium">Handle webhooks</div>
              <div className="text-sm text-muted-foreground">Set up webhooks to receive real-time payment notifications</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <h3 className="font-semibold">API Endpoints</h3>
          <div className="space-y-2">
            {apiEndpoints.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <button
                  onClick={() => toggleCategory(categoryIndex)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <span className="font-medium">{category.category}</span>
                  {expandedCategories.has(categoryIndex) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                <AnimatePresence>
                  {expandedCategories.has(categoryIndex) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-4 space-y-1 mt-2">
                        {category.endpoints.map((endpoint, endpointIndex) => (
                          <button
                            key={endpointIndex}
                            onClick={() => {
                              setSelectedCategory(categoryIndex)
                              setSelectedEndpoint(endpointIndex)
                            }}
                            className={`w-full text-left p-2 rounded text-sm transition-colors ${
                              selectedCategory === categoryIndex && selectedEndpoint === endpointIndex
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Badge variant={
                                endpoint.method === 'POST' ? 'destructive' : 'secondary'
                              } className="text-xs">
                                {endpoint.method}
                              </Badge>
                              <span className="font-mono text-xs">{endpoint.path}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 space-y-4">
          {currentEndpoint && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Badge variant={
                      currentEndpoint.method === 'POST' ? 'destructive' : 'secondary'
                    }>
                      {currentEndpoint.method}
                    </Badge>
                    <div>
                      <CardTitle className="font-mono">{currentEndpoint.path}</CardTitle>
                      <CardDescription>{currentEndpoint.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    {currentEndpoint.auth ? (
                      <Shield className="h-4 w-4 text-green-500" />
                    ) : (
                      <Lock className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">
                      {currentEndpoint.auth ? 'Authentication required' : 'Public endpoint'}
                    </span>
                  </div>

                  {currentEndpoint.request && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Request Body</h4>
                      <div className="relative">
                        <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                          <code>{JSON.stringify(currentEndpoint.request, null, 2)}</code>
                        </pre>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => copyCode(JSON.stringify(currentEndpoint.request, null, 2))}
                        >
                          {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Response</h4>
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                        <code>{JSON.stringify(currentEndpoint.response, null, 2)}</code>
                      </pre>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => copyCode(JSON.stringify(currentEndpoint.response, null, 2))}
                      >
                        {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Code Examples
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-4">
                    {['curl', 'javascript', 'python', 'php'].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setSelectedLanguage(lang)}
                        className={`px-3 py-1 rounded text-sm capitalize transition-colors ${
                          selectedLanguage === lang
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{codeExamples[selectedLanguage as keyof typeof codeExamples]}</code>
                    </pre>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => copyCode(codeExamples[selectedLanguage as keyof typeof codeExamples])}
                    >
                      {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            Additional Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-auto py-4">
              <div className="text-center">
                <Zap className="h-6 w-6 mx-auto mb-2" />
                <div className="font-medium">Quick Start Guide</div>
                <div className="text-xs text-muted-foreground">Get started in 5 minutes</div>
              </div>
            </Button>
            <Button variant="outline" className="h-auto py-4">
              <div className="text-center">
                <Shield className="h-6 w-6 mx-auto mb-2" />
                <div className="font-medium">Security Best Practices</div>
                <div className="text-xs text-muted-foreground">Keep your integration secure</div>
              </div>
            </Button>
            <Button variant="outline" className="h-auto py-4">
              <div className="text-center">
                <Book className="h-6 w-6 mx-auto mb-2" />
                <div className="font-medium">Full API Reference</div>
                <div className="text-xs text-muted-foreground">Complete endpoint documentation</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
