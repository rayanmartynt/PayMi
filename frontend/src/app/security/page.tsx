import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Shield, Lock, Eye, AlertTriangle, CheckCircle, Fingerprint } from 'lucide-react'

export default function SecurityPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-4">Security</h1>
            <p className="text-xl text-muted-foreground">
              Your security is our top priority
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Our Security Commitment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                At PayMi, we take security seriously. We employ industry-standard security measures 
                to protect your data and transactions. Our security practices are designed to meet and exceed 
                international standards for payment processing.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Encryption & Data Protection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Lock className="h-5 w-5 text-blue-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold">256-bit SSL Encryption</h3>
                    <p className="text-sm text-muted-foreground">
                      All data transmitted between your browser and our servers is encrypted using 256-bit SSL.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold">PCI DSS Compliance</h3>
                    <p className="text-sm text-muted-foreground">
                      We are PCI DSS Level 1 compliant, the highest standard for payment card security.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Fingerprint className="h-5 w-5 text-purple-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold">Tokenization</h3>
                    <p className="text-sm text-muted-foreground">
                      Sensitive card data is replaced with secure tokens, reducing risk of data exposure.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Fraud Prevention</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Eye className="h-5 w-5 text-orange-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold">Real-time Monitoring</h3>
                    <p className="text-sm text-muted-foreground">
                      Our systems monitor all transactions in real-time to detect suspicious activity.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold">Advanced Fraud Detection</h3>
                    <p className="text-sm text-muted-foreground">
                      Machine learning algorithms analyze patterns to identify and prevent fraudulent transactions.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold">3D Secure Authentication</h3>
                    <p className="text-sm text-muted-foreground">
                      Additional verification for card payments to prevent unauthorized use.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Lock className="h-5 w-5 text-blue-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold">Two-Factor Authentication (2FA)</h3>
                    <p className="text-sm text-muted-foreground">
                      Optional 2FA adds an extra layer of security to your account.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold">Secure Password Requirements</h3>
                    <p className="text-sm text-muted-foreground">
                      We enforce strong password policies to protect your account.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Eye className="h-5 w-5 text-purple-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold">Session Management</h3>
                    <p className="text-sm text-muted-foreground">
                      Automatic session timeout and secure session management.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Compliance & Certifications</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>PCI DSS Level 1 Certified</li>
                <li>ISO 27001 Information Security Management</li>
                <li>GDPR Compliant</li>
                <li>Sierra Leone Central Bank Regulations</li>
                <li>Regular Security Audits</li>
                <li>Penetration Testing</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Security Best Practices</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Help us keep your account secure by following these best practices:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Use a strong, unique password for your PayMi account</li>
                <li>Enable two-factor authentication</li>
                <li>Never share your password or API keys with anyone</li>
                <li>Keep your contact information up to date</li>
                <li>Review your account activity regularly</li>
                <li>Report suspicious activity immediately</li>
                <li>Keep your software and browser updated</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Report a Security Issue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                If you discover a security vulnerability or have concerns about security, please report it to us 
                immediately. We take all security reports seriously and will respond promptly.
              </p>
              <p className="text-muted-foreground">
                Email: security@PayMi.com<br />
                Phone: +232 76 123 456
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
