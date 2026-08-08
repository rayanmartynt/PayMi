'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { UserPlus, Users, Check, X, MessageCircle, Send, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'
import ProtectedRoute from '@/components/ProtectedRoute'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function FriendsPage() {
  const router = useRouter()
  const [friends, setFriends] = useState<any[]>([])
  const [friendRequests, setFriendRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [friendsData, requestsData] = await Promise.all([
        api.getFriends(),
        api.getFriendRequests()
      ])
      setFriends(friendsData)
      setFriendRequests(requestsData)
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
      router.push(`/customer/chat/${chat.id}`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to start chat')
    }
  }

  const handleSendMoney = (friendId: string, friendName: string) => {
    router.push(`/customer/transfer?friendId=${friendId}&friendName=${encodeURIComponent(friendName)}`)
  }

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
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : activeTab === 'friends' ? (
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
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                          {item.friend.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold">{item.friend.name}</h3>
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
        ) : (
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
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white font-semibold text-lg">
                          {item.requester.name.charAt(0).toUpperCase()}
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
      </div>
    </ProtectedRoute>
  )
}
