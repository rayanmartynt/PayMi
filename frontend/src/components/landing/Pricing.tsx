'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { TiltCard } from '@/components/ui/TiltCard'
import { Button } from '@/components/ui/Button'
import { Check } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

const plans = [
  {
    name: 'Starter',
    price: '1.5%',
    description: 'Perfect for small businesses and freelancers',
    features: [
      'Mobile Money Payments',
      'Card Payments',
      'Payment Links',
      'Basic Analytics',
      'Email Support',
      'Standard Settlement',
    ],
    popular: false,
  },
  {
    name: 'Business',
    price: '1.2%',
    description: 'For growing businesses with higher volume',
    features: [
      'Everything in Starter',
      'API Access',
      'Webhooks',
      'Advanced Analytics',
      'Priority Support',
      'Same-day Settlement',
      'Custom Branding',
      'Multi-user Access',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large organizations with custom needs',
    features: [
      'Everything in Business',
      'Dedicated Account Manager',
      'Custom Integration',
      'Volume Discounts',
      '24/7 Phone Support',
      'SLA Guarantee',
      'Advanced Fraud Protection',
      'Custom Reporting',
    ],
    popular: false,
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl lg:text-5xl font-bold mb-4">
            Simple,{' '}
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Transparent Pricing
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            No hidden fees. No surprise charges. Just straightforward pricing that scales with your business.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto perspective-scene">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 36, rotateX: 14 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformStyle: 'preserve-3d' }}
              className={plan.popular ? 'md:-translate-y-3' : ''}
            >
              <TiltCard className="h-full" maxTilt={10}>
                <Card
                  className={`h-full relative backdrop-blur-sm bg-white/85 dark:bg-gray-900/75 ${
                    plan.popular
                      ? 'border-2 border-[#4A7FA7] shadow-[0_30px_70px_rgba(74,127,167,0.28)]'
                      : 'shadow-[0_20px_50px_rgba(26,61,99,0.12)]'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2" style={{ transform: 'translateZ(40px)' }}>
                      <div className="bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                        Most Popular
                      </div>
                    </div>
                  )}
                  <CardHeader style={{ transform: 'translateZ(20px)' }}>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      {plan.price !== 'Custom' && <span className="text-muted-foreground"> per transaction</span>}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6" style={{ transform: 'translateZ(12px)' }}>
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {plan.price === 'Custom' ? (
                      <Link href="/contact" className="block">
                        <Button className="w-full" variant={plan.popular ? 'gradient' : 'outline'}>
                          Contact Sales
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/auth/signup" className="block">
                        <Button className="w-full" variant={plan.popular ? 'gradient' : 'outline'}>
                          Get Started
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
