'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Key, Webhook, Book, Code, ArrowRight } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function DeveloperPage() {
  const developerTools = [
    {
      title: 'API Keys',
      description: 'Manage API keys for e-commerce integration',
      icon: Key,
      href: '/dashboard/developer/api-keys',
      color: 'from-blue-500 to-purple-500'
    },
    {
      title: 'Webhooks',
      description: 'Configure webhooks for payment notifications',
      icon: Webhook,
      href: '/dashboard/developer/webhooks',
      color: 'from-green-500 to-teal-500'
    },
    {
      title: 'API Documentation',
      description: 'Integration guides and API reference',
      icon: Book,
      href: '/dashboard/developer/docs',
      color: 'from-orange-500 to-red-500'
    }
  ]

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Developer Tools</h1>
          <p className="text-muted-foreground">Integrate PayMi payments into your e-commerce website</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {developerTools.map((tool) => {
            const Icon = tool.icon
            return (
              <Card key={tool.href} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center text-white mb-4`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle>{tool.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{tool.description}</p>
                  <Link href={tool.href}>
                    <Button variant="outline" className="w-full">
                      Access
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Quick Start
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Create an API key in the API Keys section</li>
              <li>Copy your API key and secret (you won't see the secret again)</li>
              <li>Set up webhooks to receive payment notifications</li>
              <li>Use the API documentation to integrate payments</li>
            </ol>
            <Link href="/dashboard/developer/docs">
              <Button variant="gradient">
                View Documentation
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
