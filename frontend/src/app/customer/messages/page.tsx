'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MessageSquare, Search, Plus, Lock, Clock, Check, CheckCheck } from 'lucide-react'
import { api } from '@/lib/api'
import ProtectedRoute from '@/components/ProtectedRoute'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'

export default function MessagesPage() {
  const router = useRouter()
  const [chats, setChats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewMessageModal, setShowNewMessageModal] = useState(false)

  useEffect(() => {
    loadChats()
  }, [])

  const loadChats = async () => {
    try {
      const data = await api.getChats()
      setChats(data as any[])
    } catch (error: any) {
      toast.error(error.message || 'Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  const filteredChats = chats.filter(chat => {
    const name = chat.otherParticipant?.name || 'PayMi Support'
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const getUnreadCount = (chat: any) => {
    // This would need to be calculated from the messages
    // For now, return 0 as placeholder
    return 0
  }

  const handleChatClick = (chatId: string) => {
    router.push(`/customer/chat/${chatId}`)
  }

  const handleNewMessage = () => {
    setShowNewMessageModal(true)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'read':
        return <CheckCheck className="h-3 w-3" />
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Messages</h1>
            <p className="text-muted-foreground">Your conversations</p>
          </div>
          <Button onClick={handleNewMessage}>
            <Plus className="h-4 w-4 mr-2" />
            New Message
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="space-y-2">
          {filteredChats.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? 'No conversations match your search' : 'Start messaging your friends'}
                </p>
                {!searchQuery && (
                  <Button onClick={handleNewMessage}>
                    <Plus className="h-4 w-4 mr-2" />
                    Start a conversation
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredChats.map((chat) => (
              <Card
                key={chat.chat.id}
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => handleChatClick(chat.chat.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold truncate">
                          {chat.otherParticipant?.name || 'PayMi Support'}
                        </h3>
                        {chat.chat.lastMessageAt && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(chat.chat.lastMessageAt), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate">
                          {chat.chat.type === 'support' && <Lock className="h-3 w-3 inline mr-1" />}
                          {chat.chat.type === 'payment' && 'Payment conversation'}
                          {chat.chat.type === 'customer' && 'Direct message'}
                        </p>
                        {getUnreadCount(chat) > 0 && (
                          <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                            {getUnreadCount(chat)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {showNewMessageModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>New Message</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setShowNewMessageModal(false)
                    router.push('/customer/contacts')
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message a friend
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={async () => {
                    try {
                      const chat = await api.getSupportChat() as any
                      setShowNewMessageModal(false)
                      router.push(`/customer/chat/${chat.id}`)
                    } catch (error: any) {
                      toast.error(error.message || 'Failed to create support chat')
                    }
                  }}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Contact PayMi Support
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowNewMessageModal(false)}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
