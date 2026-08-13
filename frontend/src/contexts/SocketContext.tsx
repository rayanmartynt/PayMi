'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '@/features/auth/AuthContext'

interface SocketContextType {
  socket: Socket | null
  connected: boolean
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false
})

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    // Only connect socket when user is authenticated
    if (!isAuthenticated || !user?.id) {
      if (socket) {
        socket.disconnect()
        setSocket(null)
        setConnected(false)
      }
      return
    }

    // Get token before connecting
    const token = localStorage.getItem('token')
    if (!token) {
      console.warn('Socket: No token found in localStorage, skipping connection')
      return
    }

    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
      auth: { token, userId: user.id }
    })

    socketInstance.on('connect', () => {
      setConnected(true)
      console.log('Socket connected')
    })

    socketInstance.on('disconnect', () => {
      setConnected(false)
    })

    socketInstance.on('connect_error', (error) => {
      setConnected(false)
      console.error('Socket connection error:', error)
    })

    socketInstance.on('error', (error) => {
      console.error('Socket error:', error)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [isAuthenticated, user?.id])

  // Separate effect to emit join when socket is connected and user is available
  useEffect(() => {
    if (socket && connected && user?.id && isAuthenticated) {
      const token = localStorage.getItem('token')
      if (token) {
        const joinData = { token, userId: user.id }
        console.log('[Socket] Emitting join with data:', { 
          userId: user.id, 
          hasToken: true,
          tokenLength: token.length,
          socketConnected: connected,
          isAuthenticated,
          tokenStart: token.substring(0, 20) + '...'
        })
        socket.emit('join', joinData)
      } else {
        console.warn('[Socket] No token available for join')
      }
    } else {
      console.log('[Socket] Not ready to join:', { 
        hasSocket: !!socket, 
        connected, 
        hasUserId: !!user?.id, 
        isAuthenticated 
      })
    }
  }, [socket, connected, user?.id, isAuthenticated])

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}
