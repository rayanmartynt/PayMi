'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Book, Code, Copy, CheckCircle, AlertCircle, Zap, Lock, Globe } from 'lucide-react'
import { toast } from 'sonner'

export default function ApiDocsPage() {
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Code copied to clipboard')
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">API Documentation</h1>
        <p className="text-muted-foreground">Integrate PayMi payments into your e-commerce website</p>
      </div>

      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Start
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Create an API key in the API Keys section</li>
            <li>Copy your API key and secret (you won't see the secret again)</li>
            <li>Use the API endpoints to create payments</li>
            <li>Set up webhooks to receive payment notifications</li>
          </ol>
        </CardContent>
      </Card>

      {/* Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            All API requests must include your API key and secret in the headers:
          </p>
          <div className="bg-muted p-4 rounded-lg font-mono text-sm">
            <div>X-API-Key: pk_your_api_key_here</div>
            <div>X-API-Secret: sk_your_secret_here</div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-600 dark:text-yellow-400">
                <p className="font-medium">Security Note:</p>
                <p>Never expose your API secret in client-side code. Always make API calls from your server.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Payment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Create Payment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">POST</Badge>
              <code className="text-sm">/api/v1/create-payment</code>
            </div>
            <p className="text-sm text-muted-foreground">Create a new payment transaction</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Request Body:</p>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
              <pre>{`{
  "amount": 100.00,
  "currency": "SLE",
  "customerEmail": "customer@example.com",
  "customerName": "John Doe",
  "description": "Order #12345",
  "metadata": {
    "orderId": "12345"
  },
  "returnUrl": "https://your-site.com/success",
  "cancelUrl": "https://your-site.com/cancel"
}`}</pre>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCopyCode(`{
  "amount": 100.00,
  "currency": "SLE",
  "customerEmail": "customer@example.com",
  "customerName": "John Doe",
  "description": "Order #12345",
  "metadata": {
    "orderId": "12345"
  },
  "returnUrl": "https://your-site.com/success",
  "cancelUrl": "https://your-site.com/cancel"
}`)}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Response:</p>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
              <pre>{`{
  "success": true,
  "transaction": {
    "id": "uuid",
    "reference": "PAY-1234567890-abc123",
    "amount": "100.00",
    "currency": "SLE",
    "status": "PENDING",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "paymentUrl": "https://paymi.com/payment/PAY-1234567890-abc123",
  "checkoutUrl": "https://paymi.com/api/checkout/PAY-1234567890-abc123"
}`}</pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Get Payment Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Get Payment Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">GET</Badge>
              <code className="text-sm">/api/v1/payment/:reference</code>
            </div>
            <p className="text-sm text-muted-foreground">Retrieve payment status by reference</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Response:</p>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
              <pre>{`{
  "success": true,
  "payment": {
    "id": "uuid",
    "reference": "PAY-1234567890-abc123",
    "amount": "100.00",
    "currency": "SLE",
    "status": "COMPLETED",
    "paymentMethod": "mobile_money",
    "description": "Order #12345",
    "metadata": { "orderId": "12345" },
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:05:00Z"
  }
}`}</pre>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Payment Status Values:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><code>PENDING</code> - Payment awaiting customer action</li>
              <li><code>COMPLETED</code> - Payment successfully processed</li>
              <li><code>FAILED</code> - Payment failed or was cancelled</li>
              <li><code>REFUNDED</code> - Payment was refunded</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Webhooks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            Webhooks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            Webhooks allow you to receive real-time notifications about payment events on your server.
          </p>

          <div className="space-y-2">
            <p className="text-sm font-medium">Webhook Events:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><code>payment.completed</code> - Payment successfully completed</li>
              <li><code>payment.failed</code> - Payment failed or was cancelled</li>
              <li><code>payment.pending</code> - Payment is pending</li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Webhook Payload:</p>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
              <pre>{`{
  "event": "payment.completed",
  "data": {
    "id": "uuid",
    "reference": "PAY-1234567890-abc123",
    "amount": "100.00",
    "currency": "SLE",
    "status": "COMPLETED",
    "customerId": "uuid",
    "merchantId": "uuid",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}`}</pre>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Verify Webhook Signature:</p>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
              <pre>{`const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return hmac === signature;
}

// In your webhook handler
const signature = req.headers['x-paymi-signature'];
const isValid = verifyWebhookSignature(req.body, signature, webhookSecret);`}</pre>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCopyCode(`const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return hmac === signature;
}

// In your webhook handler
const signature = req.headers['x-paymi-signature'];
const isValid = verifyWebhookSignature(req.body, signature, webhookSecret);`)}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Example Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Example Integration (Node.js)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
            <pre>{`const axios = require('axios');

const API_KEY = 'pk_your_api_key';
const API_SECRET = 'sk_your_secret';
const BASE_URL = 'https://api.paymi.com/api/v1';

async function createPayment(amount, customerEmail, description) {
  try {
    const response = await axios.post(\`\${BASE_URL}/create-payment\`, {
      amount,
      currency: 'SLE',
      customerEmail,
      description
    }, {
      headers: {
        'X-API-Key': API_KEY,
        'X-API-Secret': API_SECRET,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Payment creation failed:', error.response?.data || error.message);
    throw error;
  }
}

// Usage
const payment = await createPayment(
  100.00,
  'customer@example.com',
  'Order #12345'
);

console.log('Payment URL:', payment.paymentUrl);
console.log('Checkout URL:', payment.checkoutUrl);`}</pre>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCopyCode(`const axios = require('axios');

const API_KEY = 'pk_your_api_key';
const API_SECRET = 'sk_your_secret';
const BASE_URL = 'https://api.paymi.com/api/v1';

async function createPayment(amount, customerEmail, description) {
  try {
    const response = await axios.post(\`\${BASE_URL}/create-payment\`, {
      amount,
      currency: 'SLE',
      customerEmail,
      description
    }, {
      headers: {
        'X-API-Key': API_KEY,
        'X-API-Secret': API_SECRET,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Payment creation failed:', error.response?.data || error.message);
    throw error;
  }
}

// Usage
const payment = await createPayment(
  100.00,
  'customer@example.com',
  'Order #12345'
);

console.log('Payment URL:', payment.paymentUrl);
console.log('Checkout URL:', payment.checkoutUrl);`)}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Code
          </Button>
        </CardContent>
      </Card>

      {/* Error Codes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Error Codes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="font-mono">400</span>
              <span>Bad Request - Invalid parameters</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-mono">401</span>
              <span>Unauthorized - Invalid API key or secret</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-mono">403</span>
              <span>Forbidden - Insufficient permissions</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-mono">404</span>
              <span>Not Found - Resource not found</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-mono">429</span>
              <span>Too Many Requests - Rate limit exceeded</span>
            </div>
            <div className="flex justify-between">
              <span className="font-mono">500</span>
              <span>Internal Server Error - Something went wrong</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rate Limits */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Limits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>API requests are rate limited to prevent abuse:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>100 requests per minute per API key</li>
            <li>1,000 requests per hour per API key</li>
          </ul>
          <p className="text-muted-foreground">
            Rate limit headers are included in all responses: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
