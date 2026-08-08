import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: August 2024</p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>1. Acceptance of Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                By accessing or using PayMi's services, you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use our services. We reserve the right to 
                modify these terms at any time, and your continued use of the service constitutes acceptance 
                of any changes.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>2. Services</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed mb-4">
                PayMi provides payment processing services including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Mobile money payment processing (Orange Money, Afrimoney, QMoney)</li>
                <li>Bank transfer processing</li>
                <li>Payment link generation</li>
                <li>API access for developers</li>
                <li>Analytics and reporting tools</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>3. User Responsibilities</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed mb-4">
                As a user of PayMi, you agree to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Provide accurate and complete information during registration</li>
                <li>Maintain the security of your account credentials</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Use our services only for legitimate business purposes</li>
                <li>Not engage in fraudulent activities or money laundering</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>4. Fees and Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Our fees are structured as follows:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Starter Plan: 1.5% per transaction</li>
                <li>Business Plan: 1.2% per transaction</li>
                <li>Enterprise Plan: Custom pricing based on volume</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Additional fees may apply for certain services such as international transactions, 
                chargebacks, or premium features. All fees are clearly displayed before you complete any transaction.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>5. Settlement and Payouts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Settlements are processed according to your plan's schedule. Standard settlements take 
                2-3 business days, while Business plan customers can access same-day settlement. 
                We reserve the right to hold funds in cases of suspected fraud, disputes, or regulatory 
                requirements.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>6. Security and Privacy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                We implement industry-standard security measures to protect your data and transactions. 
                Our privacy policy outlines how we collect, use, and protect your personal information. 
                By using our services, you consent to our data practices as described in our Privacy Policy.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>7. Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                PayMi shall not be liable for any indirect, incidental, special, or consequential 
                damages arising from the use or inability to use our services. Our total liability is 
                limited to the fees paid by you in the twelve months preceding the claim.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>8. Termination</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to suspend or terminate your account if you violate these terms 
                or engage in fraudulent activities. You may also terminate your account at any time 
                by contacting our support team. Upon termination, you will receive any remaining balance 
                according to our standard settlement schedule.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>9. Governing Law</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                These terms are governed by the laws of Sierra Leone. Any disputes arising from these 
                terms shall be resolved in the courts of Sierra Leone.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>10. Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about these Terms of Service, please contact us at:
              </p>
              <p className="text-muted-foreground mt-2">
                Email: legal@PayMi.com<br />
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
