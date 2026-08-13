'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { UserPlus, Users, Check, X, MessageCircle, Send, RefreshCw, Circle, CheckCheck, MoreVertical, Trash2, Edit2, Lock } from 'lucide-react'
import { api } from '@/lib/api'
import ProtectedRoute from '@/components/ProtectedRoute'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useSocket } from '@/contexts/SocketContext'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu'
import { useAuth } from '@/features/auth/AuthContext'

export default function FriendsPage() {
  const router = useRouter()
  const { socket } = useSocket()
  const { user } = useAuth()
  const [friends, setFriends] = useState<any[]>([])
  const [friendRequests, setFriendRequests] = useState<any[]>([])
  const [chats, setChats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'messages'>('friends')
  const [selectedChat, setSelectedChat] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [onlineStatuses, setOnlineStatuses] = useState<Record<string, { online: boolean; lastSeen: number | null }>>({})
  const [editingMessage, setEditingMessage] = useState<any>(null)
  const [editContent, setEditContent] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null)
  const [messageReactions, setMessageReactions] = useState<Record<string, any[]>>({})
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  // Close edit mode when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editingMessage && editInputRef.current && !editInputRef.current.contains(event.target as Node)) {
        setEditingMessage(null)
        setEditContent('')
      }
    }

    if (editingMessage) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [editingMessage])

  useEffect(() => {
    loadData()
  }, [])

  // Load online status for friends
  useEffect(() => {
    if (friends.length > 0) {
      const userIds = friends.map(f => f.friend.userId).filter(Boolean)
      if (userIds.length > 0) {
        api.getBatchUserStatus(userIds).then(statuses => {
          setOnlineStatuses(statuses as Record<string, { online: boolean; lastSeen: number | null }>)
        }).catch(() => {
          // Silently fail to load user statuses
        })
      }
    }
  }, [friends])

  // Real-time socket event listeners
  useEffect(() => {
    if (!socket || !user?.id) return

    // Join user's room with their userId
    socket.emit('join', user.id)

    // Listen for new messages
    const handleNewMessage = (data: any) => {
      if (selectedChat && data.chatId === selectedChat.chat?.id) {
        setMessages(prev => {
          const filtered = prev.filter(m => !m.id.startsWith('temp-'))
          return [...filtered, {
            id: data.messageId,
            content: data.content,
            senderId: data.senderId,
            createdAt: data.createdAt,
            read: false,
            status: 'delivered'
          }]
        })
      } else {
        loadData()
      }
    }

    // Listen for user online/offline status changes
    const handleUserStatusChange = (data: any) => {
      setOnlineStatuses(prev => ({
        ...prev,
        [data.userId]: { online: data.online, lastSeen: data.lastSeen }
      }))
    }

    // Listen for message deletions
    const handleMessageDeleted = (data: any) => {
      if (selectedChat && data.chatId === selectedChat.chat?.id) {
        setMessages(prev => prev.filter(m => m.id !== data.messageId))
      }
    }

    // Listen for message delivery confirmations
    const handleMessageDelivered = (data: any) => {
      if (selectedChat && data.chatId === selectedChat.chat?.id) {
        setMessages(prev => prev.map(m => 
          m.id === data.messageId ? { ...m, status: 'delivered' } : m
        ))
      }
    }

    socket.on('new_message', handleNewMessage)
    socket.on('user_status_change', handleUserStatusChange)
    socket.on('message_deleted', handleMessageDeleted)
    socket.on('message_delivered', handleMessageDelivered)

    return () => {
      socket.off('new_message', handleNewMessage)
      socket.off('user_status_change', handleUserStatusChange)
      socket.off('message_deleted', handleMessageDeleted)
      socket.off('message_delivered', handleMessageDelivered)
    }
  }, [socket, selectedChat, user?.id])

  useEffect(() => {
    if (selectedChat && selectedChat.chat?.id) {
      loadMessages(selectedChat.chat.id)
    }
  }, [selectedChat])

  // Persist selected chat to localStorage
  useEffect(() => {
    if (selectedChat) {
      localStorage.setItem('selectedChat', JSON.stringify(selectedChat))
    } else {
      localStorage.removeItem('selectedChat')
    }
  }, [selectedChat])

  // Persist messages to localStorage
  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages))
  }, [messages])

  // Load selected chat from localStorage on mount
  useEffect(() => {
    const savedChat = localStorage.getItem('selectedChat')
    if (savedChat) {
      try {
        const parsed = JSON.parse(savedChat)
        // Only restore if it has a valid ID
        if (parsed && parsed.id) {
          setSelectedChat(parsed)
        } else {
          localStorage.removeItem('selectedChat')
        }
      } catch (e) {
        console.error('Failed to parse saved chat:', e)
        localStorage.removeItem('selectedChat')
      }
    }
  }, [])

  const loadData = async () => {
    try {
      const [friendsData, requestsData, chatsData] = await Promise.all([
        api.getFriends(),
        api.getFriendRequests(),
        api.getChats()
      ])
      setFriends(friendsData as any[])
      setFriendRequests(requestsData as any[])
      setChats(chatsData as any[])
    } catch (error: any) {
      toast.error(error.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptRequest = async (friendshipId: string) => {
    try {
      await api.acceptFriendRequest(friendshipId)
      toast.success('Friend request accepted')
      await loadData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to accept request')
    }
  }

  const handleRejectRequest = async (friendshipId: string) => {
    try {
      await api.rejectFriendRequest(friendshipId)
      toast.success('Friend request rejected')
      await loadData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject request')
    }
  }

  const handleBlockFriend = async (friendshipId: string) => {
    try {
      await api.blockFriend(friendshipId)
      toast.success('Friend blocked')
      await loadData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to block friend')
    }
  }

  const handleStartChat = async (friendId: string) => {
    try {
      const chat = await api.getChatWithFriend(friendId)
      // Convert to match the chat list structure
      const friend = friends.find(f => f.friend.id === friendId)
      const formattedChat = {
        chat: chat as any,
        otherParticipant: friend?.friend || { name: 'Unknown' },
        unreadCount: 0
      }
      setSelectedChat(formattedChat)
      setActiveTab('messages')
      loadMessages((chat as any).id)
    } catch (error: any) {
      toast.error(error.message || 'Failed to start chat')
    }
  }

  const handleSendMoney = (friendId: string, friendName: string) => {
    router.push(`/customer/transfer?friendId=${friendId}&friendName=${encodeURIComponent(friendName)}`)
  }

  const loadMessages = async (chatId: string) => {
    if (!chatId || chatId === 'undefined') {
      console.error('Invalid chat ID:', chatId)
      return
    }

    try {
      const data = await api.getMessages(chatId)
      setMessages(data as any[])
    } catch (error: any) {
      toast.error(error.message || 'Failed to load messages')
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return
    if (!selectedChat.chat?.id || selectedChat.chat.id === 'undefined') {
      toast.error('Invalid chat selected')
      return
    }

    const messageContent = newMessage.trim()
    setNewMessage('')

    // Optimistic UI: Add message immediately with sent status
    const tempMessage = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      senderId: user?.id,
      createdAt: new Date().toISOString(),
      status: 'sent'
    }
    setMessages([...messages, tempMessage])

    try {
      await api.sendMessage(selectedChat.chat.id, messageContent)
      // Don't reload messages - let socket handle real-time updates
      // Just remove the temp message and let the real message come via socket
      setMessages(messages.filter(m => m.id !== tempMessage.id))
    } catch (error: any) {
      // Remove the temp message on error
      setMessages(messages.filter(m => m.id !== tempMessage.id))
      toast.error(error.message || 'Failed to send message')
    }
  }

  const handleEditMessage = (msg: any) => {
    setEditingMessage(msg)
    setEditContent(msg.content)
  }

  const handleSaveEdit = async () => {
    if (!editingMessage || !editContent.trim()) return
    
    try {
      await api.editMessage(selectedChat.chat.id, editingMessage.id, editContent)
      setEditingMessage(null)
      setEditContent('')
      await loadMessages(selectedChat.chat.id)
      toast.success('Message edited')
    } catch (error: any) {
      toast.error(error.message || 'Failed to edit message')
    }
  }

  const handleDeleteMessage = (messageId: string) => {
    // Prevent deletion of temporary/pending messages
    if (messageId.startsWith('temp-')) {
      toast.error('Cannot delete message that is still sending')
      return
    }

    setMessageToDelete(messageId)
    setDeleteConfirmOpen(true)
  }

  const confirmDeleteMessage = async () => {
    if (!messageToDelete) return

    // Optimistic UI: Remove message immediately
    const originalMessages = [...messages]
    setMessages(messages.filter(m => m.id !== messageToDelete))
    setDeleteConfirmOpen(false)
    setMessageToDelete(null)

    try {
      await api.deleteMessage(selectedChat.chat.id, messageToDelete)
      toast.success('Message deleted')
    } catch (error: any) {
      // Revert on error
      setMessages(originalMessages)
      toast.error(error.message || 'Failed to delete message')
    }
  }

  const handleDeleteChat = async () => {
    if (!confirm('Are you sure you want to delete this chat for everyone? This cannot be undone.')) return
    
    try {
      await api.deleteChat(selectedChat.chat.id)
      setSelectedChat(null)
      setMessages([])
      await loadData()
      toast.success('Chat deleted')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete chat')
    }
  }

  const handleAddReaction = async (messageId: string, emoji: string) => {
    try {
      const result = await api.addReaction(selectedChat.chat.id, messageId, emoji) as { reactions: any[] }
      setMessageReactions(prev => ({
        ...prev,
        [messageId]: result.reactions || []
      }))
      setShowReactionPicker(null)
    } catch (error: any) {
      toast.error(error.message || 'Failed to add reaction')
    }
  }

  const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥']

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Friends</h1>
            <p className="text-muted-foreground">Manage your friends and send money</p>
          </div>
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant={activeTab === 'friends' ? 'default' : 'outline'}
            onClick={() => setActiveTab('friends')}
          >
            <Users className="h-4 w-4 mr-2" />
            My Friends ({friends.length})
          </Button>
          <Button
            variant={activeTab === 'requests' ? 'default' : 'outline'}
            onClick={() => setActiveTab('requests')}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Friend Requests ({friendRequests.length})
          </Button>
          <Button
            variant={activeTab === 'messages' ? 'default' : 'outline'}
            onClick={() => setActiveTab('messages')}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Messages ({chats.length})
          </Button>
        </div>

        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
        {!loading && activeTab === 'friends' && (
          friends.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No friends yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Add friends from your contacts to start sending money and chatting
                  </p>
                  <Button onClick={() => router.push('/customer/contacts')}>
                    Find Friends
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {friends.map((item) => (
                <Card key={item.friendship.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          {item.friend.profilePicture ? (
                            <img
                              src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${item.friend.profilePicture}`}
                              alt={item.friend.name}
                              className="h-12 w-12 rounded-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg ${item.friend.profilePicture ? 'hidden' : ''}`}>
                            {item.friend.name.charAt(0).toUpperCase()}
                          </div>
                          {item.friend.userId && onlineStatuses[item.friend.userId]?.online && (
                            <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold flex items-center gap-2">
                            {item.friend.name}
                            {item.friend.userId && onlineStatuses[item.friend.userId] && (() => {
                              const status = onlineStatuses[item.friend.userId];
                              return (
                                <span className="text-xs text-muted-foreground">
                                  {status.online ? 'Online' : `Last seen ${status.lastSeen !== null ? new Date(status.lastSeen).toLocaleString() : 'Unknown'}`}
                                </span>
                              );
                            })()}
                          </h3>
                          <p className="text-sm text-muted-foreground">Friend since {new Date(item.friendship.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStartChat(item.friend.id)}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Chat
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSendMoney(item.friend.id, item.friend.name)}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Send Money
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleBlockFriend(item.friendship.id)}
                        >
                          Block
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        )}
        {!loading && activeTab === 'requests' && (
          friendRequests.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <UserPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No pending requests</h3>
                  <p className="text-muted-foreground">
                    When someone sends you a friend request, it will appear here
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {friendRequests.map((item) => (
                <Card key={item.friendship.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          {item.requester.profilePicture ? (
                            <img
                              src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${item.requester.profilePicture}`}
                              alt={item.requester.name}
                              className="h-12 w-12 rounded-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white font-semibold text-lg ${item.requester.profilePicture ? 'hidden' : ''}`}>
                            {item.requester.name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold">{item.requester.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Sent {new Date(item.friendship.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptRequest(item.friendship.id)}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectRequest(item.friendship.id)}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        )}
        {!loading && activeTab === 'messages' && (
          <div className="grid gap-4">
            {selectedChat ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedChat(null)}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Back
                      </Button>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Friend being chatted with */}
                      {selectedChat.otherParticipant && (
                        <>
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              {selectedChat.otherParticipant.profilePicture ? (
                                <img
                                  src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${selectedChat.otherParticipant.profilePicture}`}
                                  alt={selectedChat.otherParticipant.name}
                                  className="h-10 w-10 rounded-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              <div className={`h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium ${selectedChat.otherParticipant.profilePicture ? 'hidden' : ''}`}>
                                {selectedChat.otherParticipant.name.charAt(0).toUpperCase()}
                              </div>
                              {selectedChat.otherParticipant.userId && onlineStatuses[selectedChat.otherParticipant.userId]?.online && (
                                <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
                              )}
                            </div>
                            <div className="hidden sm:block">
                              <CardTitle className="text-lg flex items-center gap-2">
                                {selectedChat.otherParticipant.name}
                                <Lock className="h-4 w-4 text-green-500" />
                              </CardTitle>
                              {selectedChat.otherParticipant.userId && onlineStatuses[selectedChat.otherParticipant.userId] && (() => {
                                const status = onlineStatuses[selectedChat.otherParticipant.userId];
                                const lastSeen = status.lastSeen;
                                return (
                                  <p className="text-xs text-muted-foreground">
                                    {status.online ? 'Online' : `Last seen ${lastSeen !== null ? new Date(lastSeen).toLocaleString() : 'Unknown'}`}
                                  </p>
                                );
                              })()}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDeleteChat}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-96 overflow-y-auto mb-4 p-4 bg-gradient-to-b from-muted/50 to-muted rounded-lg flex flex-col gap-4 custom-scrollbar">
                    {messages.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No messages yet. Start the conversation!
                      </div>
                    ) : (
                      messages.map((msg: any) => {
                        const isOwnMessage = msg.senderId !== selectedChat.otherParticipant?.id
                        const canEdit = isOwnMessage && new Date(msg.createdAt).getTime() > Date.now() - 10 * 60 * 1000 // 10 minutes
                        
                        return (
                          <div
                            key={msg.id || msg.createdAt}
                            className={`flex w-full ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className="flex flex-col max-w-[75%]">
                              <div
                                className={`rounded-2xl px-4 py-2 ${
                                  isOwnMessage
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 text-gray-900'
                                }`}
                              >
                                {editingMessage?.id === msg.id ? (
                                  <div className="flex flex-col gap-2">
                                    <input
                                      ref={editInputRef}
                                      type="text"
                                      value={editContent}
                                      onChange={(e) => setEditContent(e.target.value)}
                                      className="w-full px-2 py-1 text-sm bg-white text-gray-900 rounded border"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveEdit()
                                        if (e.key === 'Escape') {
                                          setEditingMessage(null)
                                          setEditContent('')
                                        }
                                      }}
                                    />
                                    <div className="flex gap-2 justify-end">
                                      <Button size="sm" variant="ghost" onClick={() => {
                                        setEditingMessage(null)
                                        setEditContent('')
                                      }}>
                                        Cancel
                                      </Button>
                                      <Button size="sm" onClick={handleSaveEdit}>
                                        Save
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm break-words">{msg.content}</p>
                                )}
                                <div className="flex items-center justify-end gap-1 mt-1">
                                  <p className="text-xs opacity-70">
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                  {isOwnMessage && (
                                    <div className="flex items-center">
                                      {msg.status === 'sent' && <Circle key={`status-sent-${msg.id}`} className="h-3 w-3 opacity-70" />}
                                      {msg.status === 'delivered' && <CheckCheck key={`status-delivered-${msg.id}`} className="h-3 w-3 opacity-70" />}
                                      {msg.status === 'read' && <CheckCheck key={`status-read-${msg.id}`} className="h-3 w-3 text-blue-200" />}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {isOwnMessage && (
                                <div className="flex items-center justify-end gap-1 mt-1">
                                  {!msg.id.startsWith('temp-') && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                          <MoreVertical className="h-3 w-3" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent>
                                        {canEdit && (
                                          <DropdownMenuItem onClick={() => handleEditMessage(msg)}>
                                            <Edit2 className="h-4 w-4 mr-2" />
                                            Edit
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem onClick={() => handleDeleteMessage(msg.id)} className="text-destructive">
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                  {!msg.id.startsWith('temp-') && (
                                    <div className="relative">
                                      <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="h-6 w-6 p-0"
                                        onClick={() => setShowReactionPicker(showReactionPicker === msg.id ? null : msg.id)}
                                      >
                                        <span className="text-sm">😊</span>
                                      </Button>
                                      {showReactionPicker === msg.id && (
                                        <div className="absolute bottom-full right-0 mb-2 bg-white border rounded-lg shadow-lg p-2 flex gap-1 z-10">
                                          {EMOJIS.map(emoji => (
                                            <button
                                              key={emoji}
                                              className="text-xl hover:bg-gray-100 rounded p-1 transition-colors"
                                              onClick={() => handleAddReaction(msg.id, emoji)}
                                            >
                                              {emoji}
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                              {/* Display reactions */}
                              {messageReactions[msg.id] && messageReactions[msg.id].length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {messageReactions[msg.id].map((reaction: any, idx: number) => (
                                    <span 
                                      key={idx} 
                                      className="text-xs bg-white/20 rounded-full px-2 py-0.5"
                                    >
                                      {reaction.emoji}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-2 border rounded-lg bg-background"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSendMessage()
                        }
                      }}
                    />
                    <Button onClick={handleSendMessage}>
                      Send
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : chats.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
                    <p className="text-muted-foreground">
                      Start a conversation with your friends
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {chats.map((chat) => (
                  <Card key={chat.chat?.id || chat.id} className="cursor-pointer hover:bg-muted/50" onClick={() => {
                    setSelectedChat(chat)
                  }}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            {chat.otherParticipant?.profilePicture ? (
                              <img
                                src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${chat.otherParticipant.profilePicture}`}
                                alt={chat.otherParticipant.name}
                                className="h-12 w-12 rounded-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-lg ${chat.otherParticipant?.profilePicture ? 'hidden' : ''}`}>
                              {chat.otherParticipant?.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            {chat.unreadCount > 0 && (
                              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                                {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold">{chat.otherParticipant?.name || 'Unknown'}</h3>
                            <p className="text-sm text-muted-foreground">
                              {chat.lastMessage || 'No messages yet'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            {chat.lastMessageTime ? new Date(chat.lastMessageTime).toLocaleDateString() : ''}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96 p-6">
            <CardHeader>
              <CardTitle>Delete Message</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Are you sure you want to delete this message? This action cannot be undone.
              </p>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteConfirmOpen(false)
                    setMessageToDelete(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDeleteMessage}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </ProtectedRoute>
  )
}
