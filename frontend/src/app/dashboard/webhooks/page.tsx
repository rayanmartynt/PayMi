'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { CopyButton } from '@/components/ui/CopyButton'
import { 
  Plus, 
  Globe, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Play, 
  Pause,
  Key,
  Copy,
  Loader2
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { api } from '@/lib/api'

const availableEvents = [
  { id: 'payment.successful', name: 'Payment Successful', description: 'Fired when a payment succeeds' },
  { id: 'payment.failed', name: 'Payment Failed', description: 'Fired when a payment fails' },
  { id: 'payment.pending', name: 'Payment Pending', description: 'Fired when a payment is pending' },
  { id: 'refund.processed', name: 'Refund Processed', description: 'Fired when a refund is processed' },
  { id: 'customer.created', name: 'Customer Created', description: 'Fired when a new customer is created' },
  { id: 'settlement.completed', name: 'Settlement Completed', description: 'Fired when a settlement completes' },
]

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<any[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedWebhook, setSelectedWebhook] = useState<any | null>(null)
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWebhooks()
  }, [])

  const loadWebhooks = async () => {
    try {
      const data = await api.getWebhooks()
      setWebhooks((data as any).webhooks || [])
    } catch (error) {
      console.error('Failed to load webhooks:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleEvent = (eventId: string) => {
    setSelectedEvents(prev =>
      prev.includes(eventId)
        ? prev.filter(e => e !== eventId)
        : [...prev, eventId]
    )
  }

  const handleCreateWebhook = async (url: string) => {
    try {
      const newWebhook = await api.createWebhook({ url, events: selectedEvents })
      setWebhooks([...webhooks, newWebhook])
      setShowCreateModal(false)
      setSelectedEvents([])
    } catch (error) {
      console.error('Failed to create webhook:', error)
    }
  }

  const toggleWebhookStatus = async (id: string) => {
    try {
      await api.toggleWebhookStatus(id)
      setWebhooks(prev => prev.map(w =>
        w.id === id ? { ...w, status: w.status === 'active' ? 'paused' : 'active' } : w
      ))
    } catch (error) {
      console.error('Failed to toggle webhook status:', error)
    }
  }

  const deleteWebhook = async (id: string) => {
    try {
      await api.deleteWebhook(id)
      setWebhooks(prev => prev.filter(w => w.id !== id))
    } catch (error) {
      console.error('Failed to delete webhook:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Webhooks</h1>
          <p className="text-muted-foreground">Configure and manage webhook endpoints</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} variant="gradient">
          <Plus className="h-4 w-4 mr-2" />
          Add Webhook
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Webhooks</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{webhooks.filter(w => w.status === 'active').length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paused</CardTitle>
            <Pause className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{webhooks.filter(w => w.status === 'paused').length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Success Rate</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {webhooks.length > 0 
                ? ((webhooks.reduce((sum, w) => sum + (w.successRate || 0), 0) / webhooks.length).toFixed(1)) + '%'
                : '0%'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {webhooks.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No webhooks configured</h3>
              <p className="text-muted-foreground mb-4">Add your first webhook to receive real-time notifications</p>
              <Button onClick={() => setShowCreateModal(true)} variant="gradient">
                <Plus className="h-4 w-4 mr-2" />
                Add Webhook
              </Button>
            </CardContent>
          </Card>
        ) : (
          webhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">{webhook.url}</CardTitle>
                      <Badge variant={webhook.status === 'active' ? 'success' : 'secondary'}>
                        {webhook.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {webhook.lastTriggered ? `Last triggered ${formatDate(webhook.lastTriggered)}` : 'Never triggered'}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        {webhook.successRate || 0}% success rate
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleWebhookStatus(webhook.id)}
                      title={webhook.status === 'active' ? 'Pause webhook' : 'Activate webhook'}
                    >
                      {webhook.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSelectedWebhook(webhook)}
                    >
                      <Key className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => deleteWebhook(webhook.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium mb-2">Events</div>
                    <div className="flex flex-wrap gap-2">
                      {webhook.events.map((event: string) => (
                        <Badge key={event} variant="outline">
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-2">Secret</div>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-3 py-1 rounded text-sm">{webhook.secret}</code>
                      <CopyButton text={webhook.secret} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {showCreateModal && (
        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add Webhook" size="lg">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Endpoint URL</label>
              <Input id="webhook-url" placeholder="https://your-site.com/api/webhook" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Events to listen for</label>
              <div className="grid gap-2">
                {availableEvents.map((event) => (
                  <label key={event.id} className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(event.id)}
                      onChange={() => toggleEvent(event.id)}
                      className="mt-1 rounded"
                    />
                    <div>
                      <div className="font-medium">{event.name}</div>
                      <div className="text-sm text-muted-foreground">{event.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description (Optional)</label>
              <Input id="webhook-description" placeholder="What is this webhook for?" />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button 
                variant="gradient" 
                onClick={() => {
                  const urlInput = document.getElementById('webhook-url') as HTMLInputElement
                  if (urlInput?.value) {
                    handleCreateWebhook(urlInput.value)
                  }
                }}
                disabled={selectedEvents.length === 0}
              >
                Create Webhook
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {selectedWebhook && (
        <Modal isOpen={!!selectedWebhook} onClose={() => setSelectedWebhook(null)} title="Webhook Secret" size="md">
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-2">Webhook Secret</div>
              <div className="flex items-center gap-2">
                <code className="flex-1">{selectedWebhook.secret}</code>
                <CopyButton text={selectedWebhook.secret} />
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Use this secret to verify webhook signatures. Keep it secure and never share it publicly.
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setSelectedWebhook(null)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
