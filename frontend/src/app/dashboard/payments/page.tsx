'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { CopyButton } from '@/components/ui/CopyButton'
import { QRCodeSVG } from 'qrcode.react'
import { Plus, Link, QrCode, Clock, ExternalLink, Loader2 } from 'lucide-react'

import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function PaymentsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedLink, setSelectedLink] = useState<any | null>(null)
  const [showQRCode, setShowQRCode] = useState(false)
  const [loading, setLoading] = useState(false)

  const [paymentLinks, setPaymentLinks] = useState<any[]>([]);

  useEffect(() => {
    loadPaymentLinks();
  }, []);

  const loadPaymentLinks = async () => {
    try {
      const links = await api.getPaymentLinks();
      setPaymentLinks(links as any[]);
    } catch (error) {
      console.error('Failed to load payment links:', error);
    }
  };

  const handleCreatePaymentLink = async (data: any) => {
    try {
      setLoading(true);
      await api.createPaymentLink(data);
      await loadPaymentLinks();
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Failed to create payment link:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground">Create payment links and QR codes</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} variant="gradient">
          <Plus className="h-4 w-4 mr-2" />
          Create Payment Link
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {paymentLinks.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-12 text-center">
              <Link className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No payment links yet</h3>
              <p className="text-muted-foreground mb-4">Create your first payment link to start accepting payments</p>
              <Button onClick={() => setIsCreateModalOpen(true)} variant="gradient">
                <Plus className="h-4 w-4 mr-2" />
                Create Payment Link
              </Button>
            </CardContent>
          </Card>
        ) : (
          paymentLinks.map((link) => (
            <Card key={link.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{link.title || link.description || 'Payment Link'}</CardTitle>
                <CardDescription>
                  Created on {formatDate(link.createdAt)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{formatCurrency(link.amount)}</div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedLink(link)
                        setShowQRCode(false)
                      }}
                    >
                      <Link className="h-4 w-4 mr-2" />
                      Link
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedLink(link)
                        setShowQRCode(true)
                      }}
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      QR
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {link.expiresAt ? `Expires ${formatDate(link.expiresAt)}` : 'Never expires'}
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-sm ${link.active ? 'text-green-500' : 'text-red-500'}`}>
                    {link.active ? 'Active' : 'Inactive'}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => window.open(link.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <CreatePaymentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreatePaymentLink}
        loading={loading}
      />

      {selectedLink && (
        <PaymentLinkModal
          link={selectedLink}
          showQRCode={showQRCode}
          onClose={() => setSelectedLink(null)}
        />
      )}
    </div>
  )
}

function CreatePaymentModal({ 
  isOpen, 
  onClose, 
  onCreate,
  loading 
}: { 
  isOpen: boolean
  onClose: () => void
  onCreate: (data: any) => void
  loading: boolean
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [setExpiry, setSetExpiry] = useState(false)

  const handleSubmit = () => {
    if (!amount || !title) return

    onCreate({
      title,
      description,
      amount: parseFloat(amount),
      currency: 'SLE',
      expiresAt: setExpiry ? expiresAt : undefined
    })
    
    // Reset form
    setTitle('')
    setDescription('')
    setAmount('')
    setExpiresAt('')
    setSetExpiry(false)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Payment Link" size="lg">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Title</label>
          <Input 
            placeholder="Premium subscription" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Amount (SLE)</label>
          <Input 
            type="number" 
            placeholder="50000" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Description (Optional)</label>
          <Input 
            placeholder="Premium subscription" 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-2">
          <input 
            type="checkbox" 
            id="expiry" 
            className="rounded"
            checked={setExpiry}
            onChange={(e) => setSetExpiry(e.target.checked)}
          />
          <label htmlFor="expiry" className="text-sm">Set expiration date</label>
        </div>

        {setExpiry && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Expiration Date</label>
            <Input 
              type="datetime-local" 
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="gradient" 
            onClick={handleSubmit}
            disabled={loading || !amount || !title}
          >
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Create Link
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function PaymentLinkModal({ 
  link, 
  showQRCode, 
  onClose 
}: { 
  link: any
  showQRCode: boolean
  onClose: () => void 
}) {
  return (
    <Modal isOpen={!!link} onClose={onClose} title={showQRCode ? 'QR Code' : 'Payment Link'}>
      <div className="space-y-6">
        {showQRCode ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-white rounded-lg">
              <QRCodeSVG value={link.url} size={200} />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Scan this QR code to pay
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Link</label>
              <div className="flex gap-2">
                <Input value={link.url} readOnly className="flex-1" />
                <CopyButton text={link.url} />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Share this link with your customers to collect payments
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  )
}
