import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:scale-105 active:scale-95 transform-style-3d',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-lg',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground hover:shadow-md',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-md',
        ghost: 'hover:bg-accent hover:text-accent-foreground hover:shadow-sm',
        link: 'underline-offset-4 hover:underline text-primary',
        gradient: 'bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] text-white hover:opacity-90 hover:shadow-lg',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    if (asChild) {
      const { asChild: _, ...childProps } = props as any
      return React.cloneElement(childProps.children as React.ReactElement, {
        className: cn(buttonVariants({ variant, size, className }), (childProps.children as React.ReactElement).props.className),
        ...childProps
      })
    }
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
