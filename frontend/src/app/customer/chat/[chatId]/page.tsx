'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Send, ArrowLeft, RefreshCw, Lock } from 'lucide-react'
import { api } from '@/lib/api'
import ProtectedRoute from '@/components/ProtectedRoute'
import { toast } from 'sonner'
import { useRouter, useParams } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

export default function ChatPage() {
  const router = useRouter()
  const params = useParams()
  const chatId = params.chatId as string

  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [chatInfo, setChatInfo] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadMessages()
    // Poll for new messages every 5 seconds
    const interval = setInterval(loadMessages, 5000)
    return () => clearInterval(interval)
  }, [chatId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadMessages = async () => {
    try {
      const [messagesData, chatsData] = await Promise.all([
        api.getMessages(chatId),
        api.getChats()
      ])
      
      const currentChat = chatsData.find((c: any) => c.chat.id === chatId)
      setChatInfo(currentChat)
      setMessages(messagesData)
    } catch (error: any) {
      toast.error(error.message || 'Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim()) return

    setSending(true)
    try {
      const result = await api.sendMessage(chatId, newMessage)
      setMessages([...messages, result.message])
      setNewMessage('')
      
      // Mark messages as read
      await api.markMessagesAsRead(chatId)
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleSendMoney = () => {
    if (chatInfo) {
      const friendId = chatInfo.otherParticipant.id
      const friendName = chatInfo.otherParticipant.name
      router.push(`/customer/transfer?friendId=${friendId}&friendName=${encodeURIComponent(friendName)}`)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="space-y-4 h-[calc(100vh-8rem)] flex flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {chatInfo?.otherParticipant.name}
                <Lock className="h-4 w-4 text-green-500" />
              </h1>
              <p className="text-sm text-muted-foreground">End-to-end encrypted</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSendMoney}>
              <Send className="h-4 w-4 mr-2" />
              Send Money
            </Button>
            <Button variant="ghost" size="sm" onClick={loadMessages}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle className="text-lg">Messages</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
                <p className="text-muted-foreground">
                  Start the conversation with {chatInfo?.otherParticipant.name}
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === chatInfo?.otherParticipant.id ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.senderId === chatInfo?.otherParticipant.id
                        ? 'bg-muted'
                        : 'bg-primary text-primary-foreground'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </CardContent>
        </Card>

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending}
            className="flex-1"
          />
          <Button type="submit" disabled={sending || !newMessage.trim()}>
            <Send className="h-4 w-4 mr-2" />
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </form>
      </div>
    </ProtectedRoute>
  )
}
