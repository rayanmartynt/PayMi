import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">Cookie Policy</h1>
            <p className="text-muted-foreground">Last updated: August 2024</p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>1. What Are Cookies</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Cookies are small text files that are placed on your device when you visit our website. 
                They help us provide you with a better experience by remembering your preferences and 
                understanding how you use our site.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>2. How We Use Cookies</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We use cookies for the following purposes:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li><strong>Essential Cookies:</strong> Required for the website to function properly</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how visitors use our website</li>
                <li><strong>Functionality Cookies:</strong> Remember your preferences and settings</li>
                <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>3. Types of Cookies We Use</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Essential Cookies</h3>
                  <p className="text-sm text-muted-foreground">
                    These cookies are necessary for the website to function. They enable basic functionality 
                    such as security, network management, and accessibility.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Analytics Cookies</h3>
                  <p className="text-sm text-muted-foreground">
                    These cookies help us analyze how visitors use our website. We use this information to 
                    improve our website and services.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Marketing Cookies</h3>
                  <p className="text-sm text-muted-foreground">
                    These cookies are used to track visitors across websites. The intention is to display ads 
                    that are relevant and engaging for the individual user.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>4. Managing Cookies</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You can control and manage cookies in various ways. Please note that removing or blocking 
                cookies may impact your user experience and parts of our website may no longer be fully accessible.
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Browser settings allow you to accept or reject cookies</li>
                <li>You can delete cookies that have already been set</li>
                <li>You can set your browser to notify you when cookies are being sent</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>5. Third-Party Cookies</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                We may use third-party services that set cookies on our behalf. These include analytics 
                services, payment processors, and other service providers. These third parties have access 
                to your data only to perform specific tasks on our behalf.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about our Cookie Policy, please contact us at:
              </p>
              <p className="text-muted-foreground mt-2">
                Email: privacy@salonepay.com<br />
                Phone: +232 76 123 456<br />
                Address: Freetown, Sierra Leone
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
