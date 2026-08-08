'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Key, Plus, Copy, RefreshCw, Trash2, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'
import ProtectedRoute from '@/components/ProtectedRoute'
import { toast } from 'sonner'

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyPermissions, setNewKeyPermissions] = useState(['payments'])
  const [expiresIn, setExpiresIn] = useState<number | null>(null)
  const [createdKey, setCreatedKey] = useState<any>(null)
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadApiKeys()
  }, [])

  const loadApiKeys = async () => {
    try {
      const data = await api.getApiKeys()
      setApiKeys(data)
    } catch (error: any) {
      toast.error(error.message || 'Failed to load API keys')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const result = await api.createApiKey(newKeyName, newKeyPermissions, expiresIn || undefined)
      setCreatedKey(result)
      setShowCreateModal(false)
      setNewKeyName('')
      setNewKeyPermissions(['payments'])
      setExpiresIn(null)
      await loadApiKeys()
      toast.success('API key created successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create API key')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return

    try {
      await api.deleteApiKey(keyId)
      toast.success('API key deleted')
      await loadApiKeys()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete API key')
    }
  }

  const handleRegenerateSecret = async (keyId: string) => {
    if (!confirm('Are you sure you want to regenerate the secret? This will invalidate the old secret.')) return

    try {
      const result = await api.regenerateApiKeySecret(keyId)
      toast.success('Secret regenerated. Make sure to copy it now!')
      await loadApiKeys()
    } catch (error: any) {
      toast.error(error.message || 'Failed to regenerate secret')
    }
  }

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const togglePermission = (permission: string) => {
    if (newKeyPermissions.includes(permission)) {
      setNewKeyPermissions(newKeyPermissions.filter(p => p !== permission))
    } else {
      setNewKeyPermissions([...newKeyPermissions, permission])
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
            <h1 className="text-3xl font-bold">API Keys</h1>
            <p className="text-muted-foreground">Manage API keys for your e-commerce integration</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create API Key
          </Button>
        </div>

        {createdKey && (
          <Card className="border-green-500 bg-green-50 dark:bg-green-900/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-600 dark:text-green-400 mb-2">API Key Created Successfully</h3>
                  <p className="text-sm text-green-600 dark:text-green-400 mb-4">
                    Make sure to copy your secret now. You won't be able to see it again.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Key:</span>
                      <code className="flex-1 bg-white dark:bg-gray-800 px-2 py-1 rounded text-sm">
                        {createdKey.apiKey.key}
                      </code>
                      <Button size="sm" variant="outline" onClick={() => handleCopyToClipboard(createdKey.apiKey.key)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Secret:</span>
                      <code className="flex-1 bg-white dark:bg-gray-800 px-2 py-1 rounded text-sm">
                        {createdKey.secret}
                      </code>
                      <Button size="sm" variant="outline" onClick={() => handleCopyToClipboard(createdKey.secret)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-4"
                    onClick={() => setCreatedKey(null)}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {apiKeys.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No API keys yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create an API key to integrate PayMi payments into your e-commerce website
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First API Key
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {apiKeys.map((apiKey) => (
              <Card key={apiKey.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white">
                        <Key className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{apiKey.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {apiKey.key}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyToClipboard(apiKey.key)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {apiKey.isActive ? (
                            <Badge variant="secondary">Active</Badge>
                          ) : (
                            <Badge variant="destructive">Inactive</Badge>
                          )}
                          {apiKey.expiresAt && (
                            <Badge variant="outline">
                              Expires: {new Date(apiKey.expiresAt).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRegenerateSecret(apiKey.id)}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regenerate Secret
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteKey(apiKey.id)}
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
                <CardTitle>Create API Key</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateKey} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Key Name *</label>
                    <Input
                      placeholder="e.g., Production Website"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Permissions</label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newKeyPermissions.includes('payments')}
                          onChange={() => togglePermission('payments')}
                          className="rounded"
                        />
                        <span className="text-sm">Payments</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newKeyPermissions.includes('refunds')}
                          onChange={() => togglePermission('refunds')}
                          className="rounded"
                        />
                        <span className="text-sm">Refunds</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newKeyPermissions.includes('webhooks')}
                          onChange={() => togglePermission('webhooks')}
                          className="rounded"
                        />
                        <span className="text-sm">Webhooks</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Expires In (days, optional)</label>
                    <Input
                      type="number"
                      placeholder="Leave empty for no expiration"
                      value={expiresIn || ''}
                      onChange={(e) => setExpiresIn(e.target.value ? parseInt(e.target.value) : null)}
                      min="1"
                    />
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
                      {creating ? 'Creating...' : 'Create Key'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
