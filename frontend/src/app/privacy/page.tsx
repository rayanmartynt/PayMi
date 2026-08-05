import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: August 2024</p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>1. Information We Collect</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed mb-4">
                SalonePay collects the following types of information:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li><strong>Personal Information:</strong> Name, email address, phone number, business name</li>
                <li><strong>Payment Information:</strong> Card details, bank account information (encrypted)</li>
                <li><strong>Transaction Data:</strong> Payment amounts, dates, payment methods</li>
                <li><strong>Technical Data:</strong> IP address, device information, browser type</li>
                <li><strong>KYC Documents:</strong> National ID, passport, business registration certificates</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>2. How We Use Your Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We use your information to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Process payments and manage transactions</li>
                <li>Verify your identity and prevent fraud</li>
                <li>Provide customer support</li>
                <li>Improve our services and develop new features</li>
                <li>Comply with legal and regulatory requirements</li>
                <li>Send you important updates and notifications</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>3. Data Security</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>256-bit SSL encryption for all data transmission</li>
                <li>PCI DSS compliance for card payment processing</li>
                <li>Regular security audits and penetration testing</li>
                <li>Strict access controls and authentication systems</li>
                <li>Secure data storage with encrypted backups</li>
                <li>Never store full card details on our servers</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>4. Data Sharing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We may share your information in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li><strong>Payment Processors:</strong> To process transactions (e.g., Orange Money, banks)</li>
                <li><strong>Regulatory Authorities:</strong> When required by law or regulation</li>
                <li><strong>Service Providers:</strong> Third-party services that help us operate our platform</li>
                <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale of assets</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                We never sell your personal information to third parties for marketing purposes.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>5. Your Rights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your data (subject to legal requirements)</li>
                <li>Opt-out of marketing communications</li>
                <li>Export your data</li>
                <li>Object to processing of your data</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>6. Cookies and Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies and similar technologies to improve your experience, analyze usage patterns, 
                and personalize content. You can manage your cookie preferences through your browser settings. 
                We also use analytics tools to understand how our platform is used and to improve our services.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>7. Data Retention</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                We retain your data for as long as necessary to provide our services and comply with legal 
                obligations. Transaction data is retained for 7 years to comply with financial regulations. 
                You may request deletion of your account, which will remove your personal information subject 
                to legal and regulatory requirements.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>8. International Data Transfers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Your data may be transferred to and processed in countries other than Sierra Leone. We ensure 
                that any international transfers comply with applicable data protection laws and that your 
                data is adequately protected.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>9. Children's Privacy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Our services are not intended for individuals under the age of 18. We do not knowingly collect 
                personal information from children. If we become aware that we have collected such information, 
                we will take steps to delete it.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>10. Changes to This Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                We may update this privacy policy from time to time. We will notify you of any material 
                changes by posting the new policy on our website and sending you an email notification. 
                Your continued use of our services after such changes constitutes acceptance of the updated policy.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>11. Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about this Privacy Policy or your personal information, please contact us at:
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
