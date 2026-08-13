'use client'

import { useStore } from '@/store/useStore'
import { useAuth } from '@/features/auth/AuthContext'
import { Bell, Menu, Search, Moon, Sun, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useState } from 'react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function CustomerHeader() {
  const { toggleSidebar, sidebarOpen, notifications, darkMode, toggleDarkMode, setNotifications } = useStore()
  const { user } = useAuth()
  const unreadCount = notifications.filter(n => !n.read).length
  const [showNotifications, setShowNotifications] = useState(false)
  const [loadingNotifications, setLoadingNotifications] = useState(false)

  const getProfilePictureUrl = (url: string | undefined) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_URL}${url}`;
  };

  const handleNotificationClick = async () => {
    if (!showNotifications) {
      // Load fresh notifications when opening
      setLoadingNotifications(true)
      try {
        const data = await api.getNotifications({ unreadOnly: false, limit: 10 })
        setNotifications(Array.isArray(data) ? data : (data as any).notifications || [])
      } catch (error) {
        console.error('Failed to load notifications:', error)
      } finally {
        setLoadingNotifications(false)
      }
    }
    setShowNotifications(!showNotifications)
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await api.markNotificationAsRead(notificationId)
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead()
      setNotifications(notifications.map(n => ({ ...n, read: true })))
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await api.deleteNotification(notificationId)
      setNotifications(notifications.filter(n => n.id !== notificationId))
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-4 px-6">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex-1 hidden md:block">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              onClick={handleNotificationClick}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-background border rounded-lg shadow-lg z-50">
                <div className="p-4 border-b flex items-center justify-between">
                  <h3 className="font-semibold">Notifications</h3>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      className="text-xs"
                    >
                      Mark all read
                    </Button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {loadingNotifications ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Loading...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notification: any) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b hover:bg-muted/50 cursor-pointer ${!notification.read ? 'bg-muted/30' : ''}`}
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{notification.title || notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {notification.message || notification.description}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(notification.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMarkAsRead(notification.id)
                                }}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteNotification(notification.id)
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <div className="flex items-center gap-3">
            {user?.profilePicture || user?.customer?.profilePicture ? (
              <img
                src={getProfilePictureUrl(user.profilePicture || user.customer?.profilePicture)}
                alt={user.name}
                className="h-8 w-8 rounded-full object-cover"
                onError={(e) => {
                  // Fallback to initial if image fails to load
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-sm font-medium ${user?.profilePicture || user?.customer?.profilePicture ? 'hidden' : ''}`}>
              {user?.name?.charAt(0) || user?.email?.charAt(0)}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
