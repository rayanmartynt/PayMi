'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/Switch'
import { Eye, Wifi, Keyboard, Bell, Mail, Volume2 } from 'lucide-react'
import { api } from '@/lib/api'
import ProtectedRoute from '@/components/ProtectedRoute'
import { toast } from 'sonner'

export default function MessagingSettingsPage() {
  const [settings, setSettings] = useState({
    notificationsEnabled: true,
    emailAlertsEnabled: true,
    soundEnabled: true,
    readReceiptsEnabled: true,
    onlineStatusEnabled: true,
    typingIndicatorsEnabled: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const data = await api.getMessagingSettings()
      setSettings(data as any)
    } catch (error: any) {
      toast.error(error.message || 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (key: keyof typeof settings) => {
    const newSettings = { ...settings, [key]: !settings[key] }
    setSettings(newSettings)
    setSaving(true)
    
    try {
      await api.updateMessagingSettings({ [key]: newSettings[key] })
      toast.success('Settings updated')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update settings')
      // Revert on error
      setSettings(settings)
    } finally {
      setSaving(false)
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
        <div>
          <h1 className="text-3xl font-bold">Messaging Settings</h1>
          <p className="text-muted-foreground">Manage your messaging preferences</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive notifications for new messages</p>
                </div>
              </div>
              <Switch
                checked={settings.notificationsEnabled}
                onCheckedChange={() => handleToggle('notificationsEnabled')}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Email Alerts</p>
                  <p className="text-sm text-muted-foreground">Receive email notifications for important messages</p>
                </div>
              </div>
              <Switch
                checked={settings.emailAlertsEnabled}
                onCheckedChange={() => handleToggle('emailAlertsEnabled')}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Sound</p>
                  <p className="text-sm text-muted-foreground">Play sound when receiving new messages</p>
                </div>
              </div>
              <Switch
                checked={settings.soundEnabled}
                onCheckedChange={() => handleToggle('soundEnabled')}
                disabled={saving}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Read Receipts</p>
                  <p className="text-sm text-muted-foreground">Let others know when you've read their messages</p>
                </div>
              </div>
              <Switch
                checked={settings.readReceiptsEnabled}
                onCheckedChange={() => handleToggle('readReceiptsEnabled')}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wifi className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Online Status</p>
                  <p className="text-sm text-muted-foreground">Show when you're online to your contacts</p>
                </div>
              </div>
              <Switch
                checked={settings.onlineStatusEnabled}
                onCheckedChange={() => handleToggle('onlineStatusEnabled')}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Keyboard className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Typing Indicators</p>
                  <p className="text-sm text-muted-foreground">Show when you're typing a message</p>
                </div>
              </div>
              <Switch
                checked={settings.typingIndicatorsEnabled}
                onCheckedChange={() => handleToggle('typingIndicatorsEnabled')}
                disabled={saving}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
