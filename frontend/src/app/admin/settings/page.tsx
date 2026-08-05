'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Settings, Users, Shield, Bell, Globe, Database } from 'lucide-react'

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Settings</h1>
        <p className="text-muted-foreground">Configure platform settings and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Two-Factor Authentication</div>
              <div className="text-sm text-muted-foreground">Require 2FA for all admin accounts</div>
            </div>
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Session Timeout</div>
              <div className="text-sm text-muted-foreground">Auto-logout after inactivity</div>
            </div>
            <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option>15 minutes</option>
              <option>30 minutes</option>
              <option>1 hour</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">IP Whitelist</div>
              <div className="text-sm text-muted-foreground">Restrict admin access to specific IPs</div>
            </div>
            <input type="checkbox" className="h-4 w-4 rounded" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Default Merchant Status</div>
              <div className="text-sm text-muted-foreground">Status for new merchant registrations</div>
            </div>
            <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option>Pending Approval</option>
              <option>Active</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">KYC Requirement</div>
              <div className="text-sm text-muted-foreground">Require KYC before activation</div>
            </div>
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Max Transaction Limit</div>
              <div className="text-sm text-muted-foreground">Default limit for new merchants</div>
            </div>
            <Input type="number" defaultValue="1000000" className="w-32" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Email Alerts</div>
              <div className="text-sm text-muted-foreground">Receive email notifications for critical events</div>
            </div>
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">SMS Alerts</div>
              <div className="text-sm text-muted-foreground">Receive SMS for urgent security events</div>
            </div>
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Slack Integration</div>
              <div className="text-sm text-muted-foreground">Send alerts to Slack channel</div>
            </div>
            <input type="checkbox" className="h-4 w-4 rounded" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Platform Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Platform Name</label>
            <Input defaultValue="SalonePay" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Support Email</label>
            <Input type="email" defaultValue="support@salonepay.com" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Support Phone</label>
            <Input type="tel" defaultValue="+232 76 123 456" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Maintenance Mode</div>
              <div className="text-sm text-muted-foreground">Temporarily disable the platform</div>
            </div>
            <input type="checkbox" className="h-4 w-4 rounded" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Payment Processing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Auto-Settlement</div>
              <div className="text-sm text-muted-foreground">Automatically process settlements</div>
            </div>
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Settlement Schedule</div>
              <div className="text-sm text-muted-foreground">Default settlement frequency</div>
            </div>
            <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option>Daily</option>
              <option>Weekly</option>
              <option>Bi-weekly</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Fraud Detection</div>
              <div className="text-sm text-muted-foreground">Enable automatic fraud detection</div>
            </div>
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded" />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline">Reset to Defaults</Button>
        <Button variant="gradient">Save Changes</Button>
      </div>
    </div>
  )
}
