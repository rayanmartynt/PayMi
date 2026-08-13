'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { UserPlus, Users, RefreshCw, Search, CheckCircle, XCircle, Check, X } from 'lucide-react'
import { api } from '@/lib/api'
import ProtectedRoute from '@/components/ProtectedRoute'
import { toast } from 'sonner'
import { Input } from '@/components/ui/Input'

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([])
  const [syncedContacts, setSyncedContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPayMi, setFilterPayMi] = useState(false)
  const [showAllPayMiUsers, setShowAllPayMiUsers] = useState(false)
  const [friendships, setFriendships] = useState<any[]>([])
  const [friendRequests, setFriendRequests] = useState<any[]>([])
  const [currentCustomerId, setCurrentCustomerId] = useState<string | null>(null)

  useEffect(() => {
    loadSyncedContacts()
    loadFriendships()
    loadFriendRequests()
    loadCurrentCustomer()
  }, [])

  useEffect(() => {
    if (showAllPayMiUsers) {
      loadPayMiUsers()
    } else {
      loadContacts()
    }
  }, [showAllPayMiUsers])

  const loadFriendships = async () => {
    try {
      const data = await api.getFriends() as any[]
      setFriendships(data)
    } catch (error: any) {
      console.error('Failed to load friendships:', error)
    }
  }

  const loadFriendRequests = async () => {
    try {
      const data = await api.getFriendRequests() as any[]
      setFriendRequests(data)
    } catch (error: any) {
      console.error('Failed to load friend requests:', error)
    }
  }

  const loadCurrentCustomer = async () => {
    try {
      const data = await api.getCustomerProfile() as any
      setCurrentCustomerId(data.id || data.customer?.id)
    } catch (error: any) {
      console.error('Failed to load current customer:', error)
    }
  }

  useEffect(() => {
    if (showAllPayMiUsers && searchQuery) {
      const timeoutId = setTimeout(() => {
        loadPayMiUsers()
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [searchQuery, showAllPayMiUsers])

  const loadSyncedContacts = async () => {
    try {
      const data = await api.getContacts() as any[]
      setSyncedContacts(data)
    } catch (error: any) {
      toast.error(error.message || 'Failed to load synced contacts')
    }
  }

  const loadContacts = async () => {
    try {
      const data = await api.getContacts(filterPayMi) as any[]
      setContacts(data)
    } catch (error: any) {
      toast.error(error.message || 'Failed to load contacts')
    } finally {
      setLoading(false)
    }
  }

  const loadPayMiUsers = async (searchTerm?: string) => {
    setLoading(true)
    try {
      const data = await api.getPayMiUsers(searchTerm || searchQuery)
      // Get synced contact phone numbers
      const syncedPhoneNumbers = new Set(syncedContacts.map(c => c.phoneNumber))
      
      // Transform data to match contact structure
      const paymiUsers = (data as any[]).map((user: any) => ({
        id: user.id,
        name: user.name || 'Unknown',
        phoneNumber: syncedPhoneNumbers.has(user.phoneNumber) ? user.phoneNumber : null, // Only show phone if synced
        isPayMiUser: true,
        matchedCustomerId: user.id,
        userId: user.userId,
        email: user.email,
        createdAt: user.createdAt
      }))
      setContacts(paymiUsers)
    } catch (error: any) {
      toast.error(error.message || 'Failed to load PayMi users')
    } finally {
      setLoading(false)
    }
  }

  const handleSyncContacts = async () => {
    setSyncing(true)
    try {
      // In a real app, this would access the device's contacts
      // For now, we'll simulate with a prompt
      const contactsText = prompt('Enter contacts (JSON format): [{"name": "John Doe", "phoneNumber": "+232123456789"}]')
      
      if (contactsText) {
        const contactsData = JSON.parse(contactsText)
        const result = await api.syncContacts(contactsData) as any
        toast.success(`Synced ${result.total} contacts, ${result.payMiUsers} are PayMi users`)
        await loadSyncedContacts()
        if (showAllPayMiUsers) {
          loadPayMiUsers()
        } else {
          loadContacts()
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to sync contacts')
    } finally {
      setSyncing(false)
    }
  }

  const handleSendFriendRequest = async (contactId: string, customerId?: string) => {
    try {
      await api.sendFriendRequest(showAllPayMiUsers ? undefined : contactId, showAllPayMiUsers ? customerId : undefined)
      toast.success('Friend request sent')
      await loadFriendships()
      if (showAllPayMiUsers) {
        loadPayMiUsers()
      } else {
        loadContacts()
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send friend request')
    }
  }

  const getFriendshipStatus = (contactId: string, customerId?: string) => {
    const targetCustomerId = showAllPayMiUsers ? customerId : contactId
    if (!targetCustomerId || !currentCustomerId) return null

    const friendship = friendships.find(f => 
      f.friend.id === targetCustomerId || 
      f.friendship.requesterId === targetCustomerId || 
      f.friendship.receiverId === targetCustomerId
    )

    if (friendship) {
      return {
        status: friendship.friendship.status,
        isRequester: friendship.friendship.requesterId === currentCustomerId,
        friendshipId: friendship.friendship.id
      }
    }
    return null
  }

  const handleCancelRequest = async (friendshipId: string) => {
    try {
      await api.cancelFriendRequest(friendshipId)
      toast.success('Friend request cancelled')
      await loadFriendships()
      if (showAllPayMiUsers) {
        loadPayMiUsers()
      } else {
        loadContacts()
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel request')
    }
  }

  const handleDeleteContact = async (contactId: string) => {
    try {
      await api.deleteContact(contactId)
      toast.success('Contact deleted')
      if (showAllPayMiUsers) {
        loadPayMiUsers()
      } else {
        loadContacts()
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete contact')
    }
  }

  const handleToggleView = () => {
    setShowAllPayMiUsers(!showAllPayMiUsers)
    setFilterPayMi(false)
  }

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contact.phoneNumber.includes(searchQuery) ||
                         (contact.email && contact.email.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesFilter = filterPayMi ? contact.isPayMiUser : true
    return matchesSearch && matchesFilter
  })

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Contacts</h1>
            <p className="text-muted-foreground">Sync your contacts and find PayMi users</p>
          </div>
          <Button onClick={handleSyncContacts} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Contacts'}
          </Button>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Button
            variant={showAllPayMiUsers ? 'default' : 'outline'}
            onClick={handleToggleView}
          >
            <Users className="h-4 w-4 mr-2" />
            {showAllPayMiUsers ? 'My Contacts' : 'All PayMi Users'}
          </Button>
          {!showAllPayMiUsers && (
            <Button
              variant={filterPayMi ? 'default' : 'outline'}
              onClick={() => {
                setFilterPayMi(!filterPayMi)
                loadContacts()
              }}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              PayMi Only
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredContacts.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  {showAllPayMiUsers ? 'No PayMi users found' : 'No contacts found'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {showAllPayMiUsers 
                    ? 'Try adjusting your search criteria' 
                    : filterPayMi 
                      ? 'No PayMi users found in your contacts' 
                      : 'Sync your contacts to get started'}
                </p>
                {!showAllPayMiUsers && !filterPayMi && (
                  <Button onClick={handleSyncContacts} disabled={syncing}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                    Sync Contacts
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredContacts.map((contact) => (
              <Card key={contact.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold">{contact.name}</h3>
                        <p className="text-sm text-muted-foreground">{contact.phoneNumber}</p>
                        {contact.email && !showAllPayMiUsers && (
                          <p className="text-xs text-muted-foreground">{contact.email}</p>
                        )}
                        {contact.isPayMiUser && (
                          <Badge className="mt-1" variant="secondary">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            PayMi User
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {contact.isPayMiUser ? (() => {
                        const friendshipStatus = getFriendshipStatus(contact.id, contact.matchedCustomerId)
                        
                        if (friendshipStatus?.status === 'ACCEPTED') {
                          return (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              <Check className="h-3 w-3 mr-1" />
                              Friends
                            </Badge>
                          )
                        } else if (friendshipStatus?.status === 'PENDING') {
                          if (friendshipStatus.isRequester) {
                            return (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancelRequest(friendshipStatus.friendshipId)}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Cancel Request
                              </Button>
                            )
                          } else {
                            return (
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )
                          }
                        } else {
                          return (
                            <Button
                              size="sm"
                              onClick={() => handleSendFriendRequest(contact.id, contact.matchedCustomerId)}
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              Add Friend
                            </Button>
                          )
                        }
                      })() : (
                        <Badge variant="outline">
                          <XCircle className="h-3 w-3 mr-1" />
                          Not on PayMi
                        </Badge>
                      )}
                      {!showAllPayMiUsers && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteContact(contact.id)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
