import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Target, Users, Shield, Globe, Heart, Zap } from 'lucide-react'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-4">About SalonePay</h1>
            <p className="text-xl text-muted-foreground">
              Empowering Sierra Leone's digital economy with modern payment solutions
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                At SalonePay, we believe that every business in Sierra Leone deserves access to world-class payment infrastructure. 
                Our mission is to simplify digital payments, empower local businesses, and drive financial inclusion across the nation.
                We're building the payment gateway that Sierra Leone needs to compete in the global digital economy.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Our Story</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Founded in 2024, SalonePay was born from a simple observation: Sierra Leone's businesses were struggling 
                to accept digital payments effectively. Existing solutions were either too expensive, too complicated, 
                or simply didn't support local payment methods like Orange Money, Afrimoney, and QMoney.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We set out to change that. Our team of Sierra Leonean engineers and fintech experts built a platform 
                that combines global best practices with local understanding. Today, we're proud to serve hundreds of 
                businesses across the country, from small startups to established enterprises.
              </p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <Target className="h-8 w-8 text-blue-500 mb-2" />
                <CardTitle className="text-lg">Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  To democratize digital payments in Sierra Leone and empower businesses of all sizes.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-8 w-8 text-purple-500 mb-2" />
                <CardTitle className="text-lg">Our Vision</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  To become the leading payment gateway in West Africa, known for reliability and innovation.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Heart className="h-8 w-8 text-red-500 mb-2" />
                <CardTitle className="text-lg">Our Values</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Integrity, innovation, customer focus, and commitment to Sierra Leone's growth.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Why Choose Us?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-blue-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold">Local Expertise</h3>
                    <p className="text-sm text-muted-foreground">
                      Built by Sierra Leoneans, for Sierra Leoneans. We understand the local market intimately.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold">Bank-Level Security</h3>
                    <p className="text-sm text-muted-foreground">
                      PCI DSS compliant with 256-bit encryption and advanced fraud detection.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-purple-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold">Global Standards</h3>
                    <p className="text-sm text-muted-foreground">
                      World-class infrastructure that meets international payment standards.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold">Fast Settlements</h3>
                    <p className="text-sm text-muted-foreground">
                      Get your money quickly with same-day and next-day settlement options.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Join Our Journey</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                We're always looking for talented individuals who share our passion for transforming 
                Sierra Leone's digital payment landscape.
              </p>
              <div className="flex gap-4">
                <Link href="/careers">
                  <Button variant="gradient">View Open Positions</Button>
                </Link>
                <Link href="/contact">
                  <Button variant="outline">Partner With Us</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
