'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Webhook, Plus, Copy, RefreshCw, Trash2, Play, CheckCircle, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newWebhookUrl, setNewWebhookUrl] = useState('')
  const [newWebhookEvents, setNewWebhookEvents] = useState(['payment.completed', 'payment.failed'])
  const [createdWebhook, setCreatedWebhook] = useState<any>(null)
  const [testing, setTesting] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadWebhooks()
  }, [])

  const loadWebhooks = async () => {
    try {
      const data = await api.getMerchantWebhooks() as any[]
      setWebhooks(data)
    } catch (error: any) {
      toast.error(error.message || 'Failed to load webhooks')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const result = await api.createMerchantWebhook(newWebhookUrl, newWebhookEvents) as any
      setCreatedWebhook(result)
      setShowCreateModal(false)
      setNewWebhookUrl('')
      setNewWebhookEvents(['payment.completed', 'payment.failed'])
      await loadWebhooks()
      toast.success('Webhook created successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create webhook')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return

    try {
      await api.deleteMerchantWebhook(webhookId)
      toast.success('Webhook deleted')
      await loadWebhooks()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete webhook')
    }
  }

  const handleRegenerateSecret = async (webhookId: string) => {
    if (!confirm('Are you sure you want to regenerate the secret? This will invalidate the old secret.')) return

    try {
      await api.regenerateMerchantWebhookSecret(webhookId)
      toast.success('Secret regenerated. Make sure to copy it now!')
      await loadWebhooks()
    } catch (error: any) {
      toast.error(error.message || 'Failed to regenerate secret')
    }
  }

  const handleTestWebhook = async (webhookId: string) => {
    setTesting({ ...testing, [webhookId]: true })

    try {
      const result = await api.testMerchantWebhook(webhookId) as any
      if (result.success) {
        toast.success('Test webhook sent successfully')
      } else {
        toast.error(`Test webhook failed with status ${result.statusCode}`)
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send test webhook')
    } finally {
      setTesting({ ...testing, [webhookId]: false })
    }
  }

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const toggleEvent = (event: string) => {
    if (newWebhookEvents.includes(event)) {
      setNewWebhookEvents(newWebhookEvents.filter(e => e !== event))
    } else {
      setNewWebhookEvents([...newWebhookEvents, event])
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Webhooks</h1>
          <p className="text-muted-foreground">Configure webhooks to receive payment notifications</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Webhook
        </Button>
      </div>

      {createdWebhook && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-900/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-600 dark:text-green-400 mb-2">Webhook Created Successfully</h3>
                <p className="text-sm text-green-600 dark:text-green-400 mb-4">
                  Make sure to copy your secret now. You won't be able to see it again.
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Secret:</span>
                  <code className="flex-1 bg-white dark:bg-gray-800 px-2 py-1 rounded text-sm">
                    {createdWebhook.secret}
                  </code>
                  <Button size="sm" variant="outline" onClick={() => handleCopyToClipboard(createdWebhook.secret)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4"
                  onClick={() => setCreatedWebhook(null)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {webhooks.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Webhook className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No webhooks configured</h3>
              <p className="text-muted-foreground mb-4">
                Create a webhook to receive real-time payment notifications on your server
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Webhook
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {webhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white">
                      <Webhook className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{webhook.url}</h3>
                        {webhook.isActive ? (
                          <Badge variant="secondary">Active</Badge>
                        ) : (
                          <Badge variant="destructive">Inactive</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {webhook.secret.substring(0, 12)}...
                        </code>
                        {webhook.lastTriggeredAt && (
                          <span className="text-xs text-muted-foreground">
                            Last triggered: {new Date(webhook.lastTriggeredAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {JSON.parse(webhook.events).map((event: string) => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTestWebhook(webhook.id)}
                      disabled={testing[webhook.id]}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {testing[webhook.id] ? 'Testing...' : 'Test'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRegenerateSecret(webhook.id)}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerate Secret
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteWebhook(webhook.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create Webhook</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateWebhook} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Webhook URL *</label>
                  <Input
                    placeholder="https://your-server.com/paymi/webhook"
                    value={newWebhookUrl}
                    onChange={(e) => setNewWebhookUrl(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be a publicly accessible HTTPS URL
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Events</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newWebhookEvents.includes('payment.completed')}
                        onChange={() => toggleEvent('payment.completed')}
                        className="rounded"
                      />
                      <span className="text-sm">Payment Completed</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newWebhookEvents.includes('payment.failed')}
                        onChange={() => toggleEvent('payment.failed')}
                        className="rounded"
                      />
                      <span className="text-sm">Payment Failed</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newWebhookEvents.includes('payment.pending')}
                        onChange={() => toggleEvent('payment.pending')}
                        className="rounded"
                      />
                      <span className="text-sm">Payment Pending</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creating} className="flex-1">
                    {creating ? 'Creating...' : 'Create Webhook'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
