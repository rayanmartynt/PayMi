'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { CopyButton } from '@/components/ui/CopyButton'
import { Modal } from '@/components/ui/Modal'
import { Plus, Eye, EyeOff, RotateCcw, Trash2, Key, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { api } from '@/lib/api'

interface APIKeyData {
  id: string
  name: string
  publicKey: string
  secretKey: string
  webhookSecret: string
  createdAt: Date
  lastUsed?: Date
  isActive: boolean
}

export default function APIKeysPage() {
  const [apiKeys, setApiKeys] = useState<APIKeyData[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadApiKeys()
  }, [])

  const loadApiKeys = async () => {
    try {
      const data = await api.getApiKeys()
      setApiKeys((data as any).apiKeys || [])
    } catch (error) {
      // Error is already handled by API client toast notification
      console.error('Failed to load API keys:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateKey = async (name: string) => {
    try {
      const newKey = await api.createApiKey(name) as APIKeyData
      setApiKeys([...apiKeys, newKey])
      setIsCreateModalOpen(false)
    } catch (error) {
      // Error is already handled by API client toast notification
      console.error('Failed to create API key:', error)
    }
  }

  const handleRotateKey = async (keyId: string) => {
    try {
      const updatedKey = await api.regenerateApiKeySecret(keyId) as Partial<APIKeyData>
      setApiKeys(apiKeys.map(key =>
        key.id === keyId ? { ...key, ...updatedKey } : key
      ))
    } catch (error) {
      // Error is already handled by API client toast notification
      console.error('Failed to rotate API key:', error)
    }
  }

  const handleRevokeKey = async (keyId: string) => {
    try {
      await api.updateApiKey(keyId, undefined, undefined, false)
      setApiKeys(apiKeys.map(key =>
        key.id === keyId ? { ...key, isActive: false } : key
      ))
    } catch (error) {
      // Error is already handled by API client toast notification
      console.error('Failed to revoke API key:', error)
    }
  }

  const handleDeleteKey = async (keyId: string) => {
    try {
      await api.deleteApiKey(keyId)
      setApiKeys(apiKeys.filter(key => key.id !== keyId))
    } catch (error) {
      // Error is already handled by API client toast notification
      console.error('Failed to delete API key:', error)
    }
  }

  const toggleSecretVisibility = (keyId: string) => {
    setShowSecrets(prev => ({ ...prev, [keyId]: !prev[keyId] }))
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
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-muted-foreground">Manage your API keys for integration</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} variant="gradient">
          <Plus className="h-4 w-4 mr-2" />
          Generate New Key
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your API Keys</CardTitle>
          <CardDescription>
            Use these keys to authenticate your API requests. Keep your secret keys safe and never share them.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {apiKeys.length === 0 ? (
            <div className="text-center py-12">
              <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No API keys yet</h3>
              <p className="text-muted-foreground mb-4">Generate your first API key to start integrating</p>
              <Button onClick={() => setIsCreateModalOpen(true)} variant="gradient">
                <Plus className="h-4 w-4 mr-2" />
                Generate New Key
              </Button>
            </div>
          ) : (
            apiKeys.map((apiKey) => (
              <Card key={apiKey.id} className={!apiKey.isActive ? 'opacity-50' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                        <Key className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{apiKey.name}</CardTitle>
                        <CardDescription>
                          Created {formatDate(apiKey.createdAt)}
                          {apiKey.lastUsed && ` • Last used ${formatDate(apiKey.lastUsed)}`}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={apiKey.isActive ? 'success' : 'secondary'}>
                      {apiKey.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Public Key</label>
                    <div className="flex gap-2 mt-1">
                      <Input value={apiKey.publicKey} readOnly className="font-mono text-sm" />
                      <CopyButton text={apiKey.publicKey} />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Secret Key</label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={showSecrets[apiKey.id] ? apiKey.secretKey : '•'.repeat(20)}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleSecretVisibility(apiKey.id)}
                      >
                        {showSecrets[apiKey.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <CopyButton text={apiKey.secretKey} />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Webhook Secret</label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={showSecrets[apiKey.id] ? apiKey.webhookSecret : '•'.repeat(20)}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleSecretVisibility(apiKey.id)}
                      >
                        {showSecrets[apiKey.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <CopyButton text={apiKey.webhookSecret} />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    {apiKey.isActive && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRotateKey(apiKey.id)}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Rotate
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRevokeKey(apiKey.id)}
                        >
                          Revoke
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteKey(apiKey.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      <CreateKeyModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateKey}
      />
    </div>
  )
}

function CreateKeyModal({
  isOpen,
  onClose,
  onCreate
}: {
  isOpen: boolean
  onClose: () => void
  onCreate: (name: string) => void
}) {
  const [keyName, setKeyName] = useState('')

  const handleSubmit = () => {
    if (keyName.trim()) {
      onCreate(keyName)
      setKeyName('')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generate API Key">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Key Name</label>
          <Input
            placeholder="e.g., Production Key"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
          />
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Important:</strong> Make sure to copy your secret key now. You won't be able to see it again.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="gradient" onClick={handleSubmit} disabled={!keyName.trim()}>
            Generate Key
          </Button>
        </div>
      </div>
    </Modal>
  )
}
