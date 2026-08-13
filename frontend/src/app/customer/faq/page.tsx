'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import ProtectedRoute from '@/components/ProtectedRoute'
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

const faqs = [
  {
    question: 'How do I send money to a friend?',
    answer: 'You can send money to a friend by going to the Friends page, selecting a friend, and clicking the "Send Money" button. You can also use the Transfers page to send money directly using their email or phone number.'
  },
  {
    question: 'What are the fees for sending money?',
    answer: 'PayMi offers low transaction fees. Sending money to friends is free, while merchant payments may have a small processing fee. Check our pricing page for detailed fee information.'
  },
  {
    question: 'How do I add a payment method?',
    answer: 'Go to your Profile page and click on "Payment Methods". You can add your mobile money number or other supported payment methods there.'
  },
  {
    question: 'Is my money safe with PayMi?',
    answer: 'Yes, PayMi uses bank-grade security with 256-bit SSL encryption. We are PCI DSS compliant and your funds are protected by our security measures.'
  },
  {
    question: 'How do I reset my password?',
    answer: 'Click on "Forgot Password" on the login page. You will receive a password reset link via email to create a new password.'
  },
  {
    question: 'Can I use PayMi internationally?',
    answer: 'Currently, PayMi is available for domestic transactions within Sierra Leone. We are working on expanding to international markets.'
  },
  {
    question: 'How do I contact customer support?',
    answer: 'You can reach our customer support team through the Support page in your dashboard, or email us at support@paymi.sl'
  },
  {
    question: 'What is two-factor authentication?',
    answer: 'Two-factor authentication (2FA) adds an extra layer of security by requiring a code from your authenticator app in addition to your password when logging in.'
  },
  {
    question: 'How long do transfers take?',
    answer: 'Most transfers are instant. However, some transfers may take up to 24 hours depending on the payment method and bank processing times.'
  },
  {
    question: 'Can I cancel a transfer?',
    answer: "Yes, you can cancel a transfer if it hasn't been processed yet. Go to your Transfers page and select the transfer you want to cancel."
  }
]

export default function FAQPage() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index)
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <HelpCircle className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
          </div>

          <div className="grid gap-4">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardHeader
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleFAQ(index)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{faq.question}</CardTitle>
                    {expandedIndex === index ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                </CardHeader>
                {expandedIndex === index && (
                  <CardContent>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Still have questions?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Can't find the answer you're looking for? Please reach out to our support team.
              </p>
              <a
                href="mailto:support@paymi.sl"
                className="text-blue-500 hover:underline"
              >
                Contact Support
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
