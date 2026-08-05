'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { TiltCard } from '@/components/ui/TiltCard'
import { Smartphone, Shield, Globe, Zap, BarChart, Code, Users } from 'lucide-react'
import { motion } from 'framer-motion'

const features = [
  {
    icon: Smartphone,
    title: 'Mobile Money Integration',
    description: 'Seamlessly accept payments via Orange Money, Afrimoney, and QMoney - the most popular mobile money platforms in Sierra Leone.',
  },
  {
    icon: Shield,
    title: 'Bank-Level Security',
    description: 'PCI DSS compliant with 256-bit encryption and advanced fraud detection to keep your transactions safe.',
  },
  {
    icon: Code,
    title: 'Developer-Friendly API',
    description: 'Well-documented REST API with SDKs for JavaScript, Python, PHP, and Node.js for easy integration.',
  },
  {
    icon: Zap,
    title: 'Instant Settlements',
    description: 'Get your money faster with same-day and next-day settlement options to your mobile money wallet.',
  },
  {
    icon: BarChart,
    title: 'Real-Time Analytics',
    description: 'Track your revenue, transactions, and customer growth with beautiful dashboards and reports.',
  },
  {
    icon: Globe,
    title: 'Payment Links',
    description: 'Create payment links and QR codes in seconds to accept payments without a website.',
  },
  {
    icon: Users,
    title: 'Customer Management',
    description: 'Build lasting relationships with customer profiles, payment history, and lifetime value tracking.',
  },
]

export function Features() {
  return (
    <section id="features" className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl lg:text-5xl font-bold mb-4">
            Everything You Need to{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Accept Payments
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed for Sierra Leone's growing digital economy
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 perspective-scene">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 32, rotateX: 12 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <TiltCard className="h-full" maxTilt={14}>
                <Card className="h-full border-white/40 dark:border-white/10 bg-white/80 dark:bg-gray-900/70 backdrop-blur-sm shadow-[0_20px_50px_rgba(26,61,99,0.12)] hover:shadow-[0_28px_60px_rgba(26,61,99,0.18)] transition-shadow">
                  <CardHeader>
                    <div
                      className="h-12 w-12 rounded-lg bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] flex items-center justify-center mb-4 shadow-lg"
                      style={{ transform: 'translateZ(28px)' }}
                    >
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg" style={{ transform: 'translateZ(18px)' }}>
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent style={{ transform: 'translateZ(10px)' }}>
                    <CardDescription>{feature.description}</CardDescription>
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
