'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

const DropdownMenu = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { open?: boolean; onOpenChange?: (open: boolean) => void }
>(({ className, children, open, onOpenChange, ...props }, ref) => {
  const [isOpen, setIsOpen] = React.useState(false)

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen)
    onOpenChange?.(newOpen)
  }

  return (
    <div ref={ref} className={cn('relative inline-block text-left', className)} {...props}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          const childType = (child as any).type
          const isMenuItem = childType === DropdownMenuItem
          
          return React.cloneElement(child as any, {
            ...(isMenuItem ? {} : { isOpen, onOpenChange: handleOpenChange })
          })
        }
        return child
      })}
    </div>
  )
})
DropdownMenu.displayName = 'DropdownMenu'

const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { isOpen?: boolean; onOpenChange?: (open: boolean) => void; asChild?: boolean }
>(({ className, children, isOpen, onOpenChange, asChild = false, ...props }, ref) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onOpenChange?.(!isOpen)
  }

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<any>
    return React.cloneElement(child, {
      onClick: handleClick,
      ...props
    })
  }

  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  )
})
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger'

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { isOpen?: boolean }
>(({ className, children, isOpen, ...props }, ref) => {
  if (!isOpen) return null

  return (
    <div
      ref={ref}
      className={cn(
        'absolute right-0 mt-2 w-56 rounded-md border bg-popover p-1 text-popover-foreground shadow-md z-50',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
DropdownMenuContent.displayName = 'DropdownMenuContent'

const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { inset?: boolean; onClick?: () => void }
>(({ className, inset, children, onClick, ...props }, ref) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick?.()
  }

  return (
    <div
      ref={ref}
      className={cn(
        'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        inset && 'pl-8',
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </div>
  )
})
DropdownMenuItem.displayName = 'DropdownMenuItem'

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-muted', className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator'

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
}
