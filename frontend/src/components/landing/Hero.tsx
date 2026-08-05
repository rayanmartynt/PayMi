'use client'

import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/Button'
import { ArrowRight, Play, Shield, Zap, Globe } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { TiltCard } from '@/components/ui/TiltCard'

const HeroScene = dynamic(
  () => import('./HeroScene').then((m) => m.HeroScene),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-48 w-48 rounded-full bg-gradient-to-br from-[#4A7FA7]/40 to-[#1A3D63]/25 blur-2xl animate-pulse" />
      </div>
    ),
  }
)

export function Hero() {
  return (
    <section className="relative min-h-[92vh] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#F6FAFD] via-[#B3CFE5]/40 to-[#4A7FA7]/25 dark:from-gray-950 dark:via-[#1A3D63]/50 dark:to-gray-900" />
      <div
        className="absolute inset-0 opacity-50 dark:opacity-25"
        style={{
          backgroundImage:
            'radial-gradient(circle at 18% 25%, rgba(74,127,167,0.28), transparent 42%), radial-gradient(circle at 82% 70%, rgba(26,61,99,0.22), transparent 40%)',
        }}
      />

      {/* 3D canvas — right half on desktop, full-bleed behind copy on mobile */}
      <div className="pointer-events-none absolute inset-0 z-[1] opacity-40 lg:pointer-events-auto lg:left-[42%] lg:opacity-100">
        <HeroScene />
      </div>

      <div className="container relative z-10 mx-auto px-4 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-[#4A7FA7]/15 dark:bg-[#4A7FA7]/25 text-[#1A3D63] dark:text-[#B3CFE5] text-sm font-medium mb-6 border border-[#4A7FA7]/20 shadow-[0_8px_30px_rgba(26,61,99,0.12)]">
              <Zap className="h-4 w-4 mr-2" />
              Now supporting all major payment methods in Sierra Leone
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight tracking-tight text-foreground">
              Accept Payments in{' '}
              <span className="bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] bg-clip-text text-transparent">
                Sierra Leone
              </span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-lg">
              The modern payment gateway for businesses, developers, and merchants.
              Accept Orange Money, Afrimoney, QMoney, Visa, and Mastercard payments seamlessly.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  variant="gradient"
                  className="group w-full sm:w-auto shadow-[0_12px_40px_rgba(74,127,167,0.35)] hover:shadow-[0_16px_48px_rgba(74,127,167,0.45)] transition-shadow"
                >
                  Start Accepting Payments
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto backdrop-blur-sm bg-white/60 dark:bg-white/5"
                onClick={() =>
                  window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank')
                }
              >
                <Play className="mr-2 h-4 w-4" />
                Watch Demo
              </Button>
            </div>

            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                <span>PCI DSS Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-[#4A7FA7]" />
                <span>256-bit Encryption</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative hidden lg:block"
            style={{ perspective: '1200px' }}
          >
            <TiltCard className="relative z-10" maxTilt={10}>
              <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-[0_25px_80px_rgba(26,61,99,0.25)] p-8 border border-white/60 dark:border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] shadow-lg" />
                    <div>
                      <div className="font-semibold">Payment Received</div>
                      <div className="text-sm text-muted-foreground">Just now</div>
                    </div>
                  </div>
                  <div className="text-green-500 font-semibold">+SLE 50,000</div>
                </div>

                <div className="space-y-4" style={{ transformStyle: 'preserve-3d' }}>
                  {[
                    {
                      src: '/orange-money.png',
                      alt: 'Orange Money',
                      name: 'Orange Money',
                      user: 'Michael James Kamara',
                      amount: 'SLE 50,000',
                      status: 'Successful',
                      statusColor: 'text-green-500',
                      bg: 'bg-orange-100 dark:bg-orange-900/30',
                      depth: 24,
                    },
                    {
                      src: '/afrimoney.png',
                      alt: 'Afrimoney',
                      name: 'Afrimoney',
                      user: 'Rehanatu Kaiaki',
                      amount: 'SLE 25,000',
                      status: 'Successful',
                      statusColor: 'text-green-500',
                      bg: 'bg-purple-100 dark:bg-purple-900/30',
                      depth: 16,
                    },
                    {
                      src: '/qmoney.jpg',
                      alt: 'QMoney',
                      name: 'QMoney',
                      user: 'Eric Fabu',
                      amount: 'SLE 100,000',
                      status: 'Pending',
                      statusColor: 'text-yellow-500',
                      bg: 'bg-sky-100 dark:bg-sky-900/30',
                      depth: 8,
                    },
                  ].map((row) => (
                    <div
                      key={row.name}
                      className="flex items-center justify-between p-4 bg-gray-50/90 dark:bg-gray-800/60 rounded-lg border border-black/5 dark:border-white/5 shadow-sm"
                      style={{ transform: `translateZ(${row.depth}px)` }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-8 w-8 rounded-lg ${row.bg} flex items-center justify-center overflow-hidden`}
                        >
                          <img src={row.src} alt={row.alt} className="h-6 w-6 object-contain" />
                        </div>
                        <div>
                          <div className="font-medium">{row.name}</div>
                          <div className="text-sm text-muted-foreground">{row.user}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{row.amount}</div>
                        <div className={`text-sm ${row.statusColor}`}>{row.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TiltCard>

            <div className="absolute -top-8 -right-8 h-32 w-32 bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] rounded-full blur-3xl opacity-30 animate-float-slow" />
            <div className="absolute -bottom-8 -left-8 h-32 w-32 bg-gradient-to-r from-[#B3CFE5] to-[#4A7FA7] rounded-full blur-3xl opacity-30 animate-float-slow-delayed" />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-20 text-center relative z-10"
        >
          <p className="text-sm text-muted-foreground mb-8">
            Trusted by leading businesses in Sierra Leone
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {['TechCorp SL', 'Freetown Retail', 'Sierra E-commerce', 'Local Business', 'StartUp Hub'].map(
              (company) => (
                <div
                  key={company}
                  className="text-xl font-semibold text-gray-400 dark:text-gray-500"
                >
                  {company}
                </div>
              )
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
