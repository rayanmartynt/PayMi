'use client'

import { Card, CardContent } from '@/components/ui/Card'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const faqs = [
  {
    question: 'What payment methods do you support?',
    answer: 'We support all major payment methods in Sierra Leone including Orange Money, Afrimoney, QMoney, Visa, Mastercard, and bank transfers from Rokel Commercial Bank, Sierra Leone Commercial Bank, Union Trust Bank, and Guaranty Trust Bank.',
  },
  {
    question: 'How long does it take to receive settlements?',
    answer: 'We offer flexible settlement options. Standard settlements are processed within 2-3 business days. Business plan customers can access same-day settlement, while Enterprise customers have access to real-time settlement options.',
  },
  {
    question: 'Is my data secure with PayMi?',
    answer: 'Absolutely. We are PCI DSS compliant and use 256-bit encryption for all transactions. We also implement advanced fraud detection systems and never store sensitive card information on our servers.',
  },
  {
    question: 'What are your fees?',
    answer: 'Our pricing is transparent: Starter plan is 1.5% per transaction, Business plan is 1.2% per transaction, and Enterprise plans have custom pricing based on volume. There are no hidden fees or setup charges.',
  },
  {
    question: 'Do I need a website to use PayMi?',
    answer: 'No! You can use our payment links and QR codes to accept payments without a website. Simply create a payment link, share it with your customers via WhatsApp, SMS, or email, and start accepting payments immediately.',
  },
  {
    question: 'How do I integrate PayMi with my website?',
    answer: 'We provide a well-documented REST API with SDKs for JavaScript, Python, PHP, and Node.js. Most integrations can be completed in less than a day. We also have a dedicated integration team to help you get started.',
  },
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl lg:text-5xl font-bold mb-4">
            Frequently Asked{' '}
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about PayMi
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <h3 className="font-semibold text-lg">{faq.question}</h3>
                  {openIndex === index ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-4" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-4" />
                  )}
                </button>
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="text-muted-foreground mt-4 pt-4 border-t">{faq.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
