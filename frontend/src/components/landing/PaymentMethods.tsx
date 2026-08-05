'use client'

import { Card, CardContent } from '@/components/ui/Card'
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { useRef } from 'react'

const paymentMethods = [
  { name: 'Orange Money', icon: '/orange-money.png', color: 'from-orange-500 to-orange-600' },
  { name: 'Afrimoney', icon: '/afrimoney.png', color: 'from-purple-500 to-purple-600' },
  { name: 'QMoney', icon: '/qmoney.jpg', color: 'from-orange-500 to-orange-600' },
]

function PaymentCard({ method, index }: { method: typeof paymentMethods[0]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseX = useSpring(x, { stiffness: 500, damping: 100 })
  const mouseY = useSpring(y, { stiffness: 500, damping: 100 })

  const rotateX = useTransform(mouseY, [-0.5, 0.5], [15, -15])
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-15, 15])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseXVal = (e.clientX - rect.left) / width - 0.5
    const mouseYVal = (e.clientY - rect.top) / height - 0.5
    x.set(mouseXVal)
    y.set(mouseYVal)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      style={{
        perspective: 1000,
        rotateX,
        rotateY,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <Card className="h-full hover:shadow-2xl transition-all duration-300 transform-style-3d">
        <CardContent className="flex flex-col items-center justify-center p-6">
          <div className={`h-16 w-16 rounded-2xl bg-gradient-to-r ${method.color} flex items-center justify-center mb-4 overflow-hidden transform transition-transform hover:scale-110 duration-300`}>
            {method.icon.startsWith('/') ? (
              <img src={method.icon} alt={method.name} className="h-12 w-12 object-contain" />
            ) : (
              <span className="text-3xl">{method.icon}</span>
            )}
          </div>
          <p className="font-semibold text-center">{method.name}</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function PaymentMethods() {
  return (
    <section className="py-20 lg:py-32 bg-muted/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl lg:text-5xl font-bold mb-4">
            All Payment Methods{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Supported
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Accept payments through all major mobile money platforms in Sierra Leone
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {paymentMethods.map((method, index) => (
            <PaymentCard key={method.name} method={method} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
