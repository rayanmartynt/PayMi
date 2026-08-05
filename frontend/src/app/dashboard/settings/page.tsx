'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { User, Building2, Mail, Phone, Lock, Bell, Globe, CreditCard, Loader2, Camera } from 'lucide-react'
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
        webhookUrl: formData.webhookUrl
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
              <CreditCard className="h-5 w-5 text-muted-foreground" />
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
