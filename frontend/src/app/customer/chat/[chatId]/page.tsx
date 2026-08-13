'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Send, ArrowLeft, RefreshCw, Lock, MoreVertical, Trash2, Edit2, Check, CheckCheck } from 'lucide-react'
import { api } from '@/lib/api'
import ProtectedRoute from '@/components/ProtectedRoute'
import { toast } from 'sonner'
import { useRouter, useParams } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import { useAuth } from '@/features/auth/AuthContext'
import { useSocket } from '@/contexts/SocketContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'

export default function ChatPage() {
  const router = useRouter()
  const params = useParams()
  const chatId = params.chatId as string
  const { user } = useAuth()
  const socket = useSocket()

  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [chatInfo, setChatInfo] = useState<any>(null)
  const [editingMessage, setEditingMessage] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadMessages()
  }, [chatId])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdownId(null)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // Real-time socket event listeners
  useEffect(() => {
    const socketInstance = socket?.socket
    if (!socketInstance || !user?.id) return

    socketInstance.emit('join', user.id)

    const handleNewMessage = (data: any) => {
      if (data.chatId === chatId) {
        setMessages(prev => [...prev, {
          id: data.messageId,
          content: data.content,
          senderId: data.senderId,
          createdAt: data.createdAt,
          read: false,
          status: 'delivered'
        }])
      }
    }

    const handleMessageDelivered = (data: any) => {
      if (data.chatId === chatId) {
        setMessages(prev => prev.map(m => 
          m.id === data.messageId ? { ...m, status: 'delivered' } : m
        ))
      }
    }

    socketInstance.on('new_message', handleNewMessage)
    socketInstance.on('message_delivered', handleMessageDelivered)

    return () => {
      if (socketInstance) {
        socketInstance.off('new_message', handleNewMessage)
        socketInstance.off('message_delivered', handleMessageDelivered)
      }
    }
  }, [socket, user?.id, chatId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadMessages = async () => {
    try {
      setLoading(true)
      const [messagesData, chatsData] = await Promise.all([
        api.getMessages(chatId),
        api.getChats()
      ])
      
      const currentChat = (chatsData as any[]).find((c: any) => c.chat.id === chatId)
      setChatInfo(currentChat)
      setMessages(messagesData as any[])
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
      const result = await api.sendMessage(chatId, newMessage) as any
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

  const handleDeleteMessage = async (messageId: string, deleteForEveryone: boolean = false) => {
    try {
      await api.deleteMessage(chatId, messageId, deleteForEveryone)
      if (deleteForEveryone) {
        setMessages(messages.filter(m => m.id !== messageId))
        toast.success('Message deleted for everyone')
      } else {
        setMessages(messages.map(m => 
          m.id === messageId ? { ...m, deletedForMe: true } : m
        ))
        toast.success('Message deleted for you')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete message')
    }
  }

  const handleEditMessage = async (messageId: string) => {
    if (!editContent.trim()) return
    try {
      await api.editMessage(chatId, messageId, editContent)
      setMessages(messages.map(m => 
        m.id === messageId 
          ? { ...m, content: editContent, edited: true }
          : m
      ))
      setEditingMessage(null)
      setEditContent('')
      toast.success('Message updated')
    } catch (error: any) {
      toast.error(error.message || 'Failed to edit message')
    }
  }

  const startEditing = (message: any) => {
    setEditingMessage(message.id)
    setEditContent(message.content)
  }

  const cancelEditing = () => {
    setEditingMessage(null)
    setEditContent('')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />
      case 'delivered':
        return <CheckCheck className="h-3 w-3" />
      case 'sent':
        return <Check className="h-3 w-3" />
      default:
        return null
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
              messages.map((message) => {
                const isOwnMessage = message.senderId === user?.id
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        isOwnMessage
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {editingMessage === message.id ? (
                        <div className="space-y-2">
                          <Input
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="bg-background text-foreground"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleEditMessage(message.id)}>
                              <Check className="h-3 w-3 mr-1" />
                              Save
                            </Button>
                            <Button size="sm" variant="ghost" onClick={cancelEditing}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {message.deletedForMe ? (
                            <p className="text-sm italic opacity-50">This message was deleted</p>
                          ) : (
                            <p className="text-sm">{message.content}</p>
                          )}
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs opacity-70 flex items-center gap-1">
                              {message.edited && <span className="italic">(edited)</span>}
                              {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <div className="flex items-center gap-2">
                              {isOwnMessage && getStatusIcon(message.status)}
                              {isOwnMessage && (
                                <DropdownMenu open={openDropdownId === message.id} onOpenChange={(open) => setOpenDropdownId(open ? message.id : null)}>
                                  <DropdownMenuTrigger asChild={true}>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-50 hover:opacity-100">
                                      <MoreVertical className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => startEditing(message)}>
                                      <Edit2 className="h-3 w-3 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDeleteMessage(message.id, false)}>
                                      <Trash2 className="h-3 w-3 mr-2" />
                                      Delete for me
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDeleteMessage(message.id, true)} className="text-destructive">
                                      <Trash2 className="h-3 w-3 mr-2" />
                                      Delete for everyone
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )
              })
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
