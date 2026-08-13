'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { User, Building2, Mail, Phone, Lock, Bell, Globe, Wallet, Loader2, Camera, Shield, Key, Copy, Check } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export default function SettingsPage() {
  const [merchant, setMerchant] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPicture, setUploadingPicture] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [twoFactorSetupStep, setTwoFactorSetupStep] = useState<'none' | 'setup' | 'verify'>('none')
  const [twoFactorSecret, setTwoFactorSecret] = useState('')
  const [twoFactorQrCode, setTwoFactorQrCode] = useState('')
  const [twoFactorBackupCodes, setTwoFactorBackupCodes] = useState<string[]>([])
  const [twoFactorVerificationCode, setTwoFactorVerificationCode] = useState('')
  const [twoFactorLoading, setTwoFactorLoading] = useState(false)
  const [copiedToClipboard, setCopiedToClipboard] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    businessType: '',
    businessAddress: '',
    webhookUrl: ''
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    loadMerchantProfile()
    loadTwoFactorStatus()
  }, [])

  const loadMerchantProfile = async () => {
    try {
      const data = await api.getMerchantProfile()
      setMerchant(data)
      setFormData({
        name: (data as any).user?.name || '',
        email: (data as any).user?.email || '',
        phone: (data as any).phoneNumber || '',
        businessName: (data as any).businessName || '',
        businessType: (data as any).businessType || '',
        businessAddress: (data as any).businessAddress || '',
        webhookUrl: (data as any).webhookUrl || ''
      })
      if ((data as any).profilePicture) {
        setPreviewImage(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${(data as any).profilePicture}`)
      }
    } catch (error) {
      console.error('Failed to load merchant profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPEG, PNG, and WebP images are allowed')
      return
    }

    setUploadingPicture(true)
    const formData = new FormData()
    formData.append('picture', file)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/merchants/profile/picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      toast.success('Profile picture updated successfully')
      setPreviewImage(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${data.profilePicture}`)
      loadMerchantProfile()
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload profile picture')
    } finally {
      setUploadingPicture(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      await api.updateMerchantProfile({
        businessName: formData.businessName,
        businessType: formData.businessType,
        businessAddress: formData.businessAddress,
        phoneNumber: formData.phone,
      })
      await loadMerchantProfile()
    } catch (error) {
      console.error('Failed to update profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    setPasswordError('')
    setPasswordSuccess('')
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }
    
    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return
    }
    
    if (!passwordData.currentPassword) {
      setPasswordError('Please enter your current password')
      return
    }
    
    setPasswordSaving(true)
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })
      setPasswordSuccess('Password updated successfully')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setPasswordSuccess(''), 3000)
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password')
    } finally {
      setPasswordSaving(false)
    }
  }

  const loadTwoFactorStatus = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/two-factor/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      setTwoFactorEnabled(data.enabled || false)
    } catch (error) {
      console.error('Failed to load 2FA status:', error)
    }
  }

  const handleEnableTwoFactor = async () => {
    setTwoFactorLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/two-factor/setup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        setTwoFactorSecret(data.secret)
        setTwoFactorQrCode(data.qrCode)
        setTwoFactorSetupStep('setup')
      } else {
        toast.error(data.error || 'Failed to setup 2FA')
      }
    } catch (error) {
      toast.error('Failed to setup 2FA')
    } finally {
      setTwoFactorLoading(false)
    }
  }

  const handleVerifyTwoFactor = async () => {
    setTwoFactorLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/two-factor/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          token: twoFactorVerificationCode,
          secret: twoFactorSecret
        })
      })
      const data = await response.json()
      if (response.ok) {
        setTwoFactorEnabled(true)
        setTwoFactorSetupStep('none')
        setTwoFactorBackupCodes(data.backupCodes || [])
        toast.success('2FA enabled successfully')
      } else {
        toast.error(data.error || 'Invalid verification code')
      }
    } catch (error) {
      toast.error('Failed to verify 2FA')
    } finally {
      setTwoFactorLoading(false)
    }
  }

  const handleDisableTwoFactor = async () => {
    setTwoFactorLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/two-factor/disable`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        setTwoFactorEnabled(false)
        setTwoFactorBackupCodes([])
        toast.success('2FA disabled successfully')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to disable 2FA')
      }
    } catch (error) {
      toast.error('Failed to disable 2FA')
    } finally {
      setTwoFactorLoading(false)
    }
  }

  const copyBackupCodes = () => {
    const codesText = twoFactorBackupCodes.join('\n')
    navigator.clipboard.writeText(codesText)
    setCopiedToClipboard(true)
    setTimeout(() => setCopiedToClipboard(false), 2000)
    toast.success('Backup codes copied to clipboard')
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
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      {/* Profile Picture Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>Upload your business profile picture</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="h-24 w-24 rounded-full overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-2xl font-medium">
                {previewImage ? (
                  <img 
                    src={previewImage} 
                    alt="Profile" 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{merchant?.businessName?.charAt(0) || merchant?.user?.name?.charAt(0) || 'M'}</span>
                )}
              </div>
              <label htmlFor="merchant-profile-picture" className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                {uploadingPicture ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </label>
              <input
                id="merchant-profile-picture"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePictureUpload}
                className="hidden"
                disabled={uploadingPicture}
              />
            </div>
            <div className="flex-1">
              <h3 className="font-medium">Upload your business logo</h3>
              <p className="text-sm text-muted-foreground mt-1">
                JPEG, PNG, or WebP (max 5MB)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal and business information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="pl-10" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  value={formData.email} 
                  disabled
                  className="pl-10 bg-muted" 
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="pl-10" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Business Name</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  value={formData.businessName} 
                  onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                  className="pl-10" 
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Business Type</label>
              <Input 
                value={formData.businessType} 
                onChange={(e) => setFormData({...formData, businessType: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Business Address</label>
              <Input 
                value={formData.businessAddress} 
                onChange={(e) => setFormData({...formData, businessAddress: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Webhook URL</label>
            <Input 
              value={formData.webhookUrl} 
              onChange={(e) => setFormData({...formData, webhookUrl: e.target.value})}
              placeholder="https://your-domain.com/webhook"
            />
          </div>

          <Button variant="gradient" onClick={handleSaveProfile} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Manage your password and security settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {passwordSuccess && (
            <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm p-3 rounded-md">
              {passwordSuccess}
            </div>
          )}
          {passwordError && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {passwordError}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                type="password" 
                placeholder="••••••••" 
                className="pl-10"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                disabled={passwordSaving}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-10"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  disabled={passwordSaving}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-10"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  disabled={passwordSaving}
                />
              </div>
            </div>
          </div>

          <Button variant="gradient" onClick={handlePasswordChange} disabled={passwordSaving}>
            {passwordSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Update Password
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>Add an extra layer of security to your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {twoFactorEnabled ? (
            <>
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-md">
                <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div>
                  <div className="font-medium text-green-700 dark:text-green-400">2FA is enabled</div>
                  <div className="text-sm text-green-600 dark:text-green-500">Your account is protected with two-factor authentication</div>
                </div>
              </div>

              {twoFactorBackupCodes.length > 0 && (
                <div className="space-y-3 p-4 bg-muted rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-muted-foreground" />
                      <div className="font-medium text-sm">Backup Codes</div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={copyBackupCodes}>
                      {copiedToClipboard ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    {twoFactorBackupCodes.map((code, index) => (
                      <div key={index} className="p-2 bg-background rounded">{code}</div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Save these codes in a secure location. You can use them to access your account if you lose your 2FA device.</p>
                </div>
              )}

              <Button variant="outline" onClick={handleDisableTwoFactor} disabled={twoFactorLoading}>
                {twoFactorLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Disable 2FA
              </Button>
            </>
          ) : (
            <>
              {twoFactorSetupStep === 'none' && (
                <>
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-md">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">2FA is disabled</div>
                      <div className="text-sm text-muted-foreground">Enable two-factor authentication to protect your account</div>
                    </div>
                  </div>
                  <Button variant="gradient" onClick={handleEnableTwoFactor} disabled={twoFactorLoading}>
                    {twoFactorLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Enable 2FA
                  </Button>
                </>
              )}

              {twoFactorSetupStep === 'setup' && (
                <div className="space-y-4">
                  <div className="text-sm space-y-2">
                    <p>1. Install an authenticator app (Google Authenticator, Authy, etc.)</p>
                    <p>2. Scan the QR code below with your authenticator app</p>
                    <p>3. Enter the verification code from the app</p>
                  </div>
                  
                  {twoFactorQrCode && (
                    <div className="flex justify-center p-4 bg-white rounded-md">
                      <img src={twoFactorQrCode} alt="2FA QR Code" className="w-48 h-48" />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Secret Key (manual entry)</label>
                    <div className="flex gap-2">
                      <Input 
                        value={twoFactorSecret} 
                        readOnly 
                        className="font-mono text-sm"
                      />
                      <Button variant="outline" size="icon" onClick={() => {
                        navigator.clipboard.writeText(twoFactorSecret)
                        toast.success('Secret copied to clipboard')
                      }}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Verification Code</label>
                    <Input 
                      placeholder="Enter 6-digit code"
                      value={twoFactorVerificationCode}
                      onChange={(e) => setTwoFactorVerificationCode(e.target.value)}
                      maxLength={6}
                      className="font-mono text-center text-lg tracking-widest"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="gradient" 
                      onClick={handleVerifyTwoFactor} 
                      disabled={twoFactorLoading || twoFactorVerificationCode.length !== 6}
                      className="flex-1"
                    >
                      {twoFactorLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      Verify & Enable
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setTwoFactorSetupStep('none')
                        setTwoFactorSecret('')
                        setTwoFactorQrCode('')
                        setTwoFactorVerificationCode('')
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Configure your notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">Email Notifications</div>
                <div className="text-sm text-muted-foreground">Receive payment notifications via email</div>
              </div>
            </div>
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">SMS Notifications</div>
                <div className="text-sm text-muted-foreground">Receive payment notifications via SMS</div>
              </div>
            </div>
            <input type="checkbox" className="h-4 w-4 rounded" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">Settlement Alerts</div>
                <div className="text-sm text-muted-foreground">Get notified when settlements are processed</div>
              </div>
            </div>
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Customize your experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">Default Currency</div>
                <div className="text-sm text-muted-foreground">Select your preferred currency</div>
              </div>
            </div>
            <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option>SLE - Sierra Leone Leone</option>
              <option>USD - US Dollar</option>
              <option>EUR - Euro</option>
              <option>GBP - British Pound</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wallet className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">Default Payment Method</div>
                <div className="text-sm text-muted-foreground">Set your preferred payment method</div>
              </div>
            </div>
            <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option>Orange Money</option>
              <option>Afrimoney</option>
              <option>QMoney</option>
            </select>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
