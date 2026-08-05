'use client'

import { useRef, useState, type ReactNode, type MouseEvent } from 'react'
import { cn } from '@/lib/utils'

interface TiltCardProps {
  children: ReactNode
  className?: string
  maxTilt?: number
  glare?: boolean
}

export function TiltCard({
  children,
  className,
  maxTilt = 12,
  glare = true,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState(
    'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)'
  )
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 })

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    const rotateY = (x - 0.5) * maxTilt * 2
    const rotateX = (0.5 - y) * maxTilt * 2

    setTransform(
      `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`
    )
    setGlarePos({ x: x * 100, y: y * 100, opacity: 0.35 })
  }

  const handleLeave = () => {
    setTransform(
      'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)'
    )
    setGlarePos((prev) => ({ ...prev, opacity: 0 }))
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={cn('relative transition-transform duration-200 ease-out will-change-transform', className)}
      style={{ transform, transformStyle: 'preserve-3d' }}
    >
      {children}
      {glare && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-200"
          style={{
            opacity: glarePos.opacity,
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.55), transparent 55%)`,
            transform: 'translateZ(1px)',
          }}
        />
      )}
    </div>
  )
}
