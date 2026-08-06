'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { MapPin, Clock, DollarSign, Briefcase, Users, Zap, Mail } from 'lucide-react'
import Link from 'next/link'

export default function CareersPage() {
  const openings = [
    {
      title: 'Senior Full Stack Developer',
      department: 'Engineering',
      location: 'Freetown, Sierra Leone',
      type: 'Full-time',
      salary: 'Competitive',
      description: 'Join our engineering team to build the future of payments in Sierra Leone. Looking for experienced developers with React, Node.js, and cloud infrastructure experience.'
    },
    {
      title: 'Product Manager',
      department: 'Product',
      location: 'Freetown, Sierra Leone',
      type: 'Full-time',
      salary: 'Competitive',
      description: 'Lead the product strategy for PayMi. Work closely with engineering and design to deliver world-class payment solutions.'
    },
    {
      title: 'Customer Success Manager',
      department: 'Customer Success',
      location: 'Freetown, Sierra Leone',
      type: 'Full-time',
      salary: 'Competitive',
      description: 'Help our merchants succeed by providing exceptional support and guidance. Build relationships and drive adoption of our platform.'
    },
    {
      title: 'Marketing Manager',
      department: 'Marketing',
      location: 'Freetown, Sierra Leone',
      type: 'Full-time',
      salary: 'Competitive',
      description: 'Drive growth through strategic marketing initiatives. Manage campaigns, content, and partnerships to expand our reach.'
    },
    {
      title: 'Data Analyst',
      department: 'Analytics',
      location: 'Freetown, Sierra Leone',
      type: 'Full-time',
      salary: 'Competitive',
      description: 'Analyze payment data to provide insights that drive business decisions. Build dashboards and reports for stakeholders.'
    },
    {
      title: 'Compliance Officer',
      department: 'Legal & Compliance',
      location: 'Freetown, Sierra Leone',
      type: 'Full-time',
      salary: 'Competitive',
      description: 'Ensure PayMi complies with all regulatory requirements. Manage KYC processes and maintain relationships with regulators.'
    }
  ]

  const benefits = [
    'Competitive salary and equity',
    'Health insurance coverage',
    'Flexible working hours',
    'Professional development budget',
    'Remote work options',
    'Annual performance bonus',
    'Paid time off and holidays',
    'Modern office in Freetown'
  ]

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-4">Join Our Team</h1>
            <p className="text-xl text-muted-foreground">
              Help us build the future of payments in Sierra Leone
            </p>
          </div>

          <Card className="mb-12">
            <CardHeader>
              <CardTitle>Why Work at PayMi?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                We're on a mission to transform Sierra Leone's digital payment landscape. Join a team of passionate 
                individuals building solutions that matter.
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-blue-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold">Impact</h3>
                    <p className="text-sm text-muted-foreground">
                      Your work directly affects thousands of businesses across Sierra Leone
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold">Growth</h3>
                    <p className="text-sm text-muted-foreground">
                      Learn from experienced professionals and grow your career
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Briefcase className="h-5 w-5 text-purple-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold">Innovation</h3>
                    <p className="text-sm text-muted-foreground">
                      Work with cutting-edge technology and solve complex problems
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-12">
            <CardHeader>
              <CardTitle>Benefits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Open Positions</h2>
            <div className="space-y-4">
              {openings.map((opening, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl mb-2">{opening.title}</CardTitle>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            {opening.department}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {opening.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {opening.type}
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {opening.salary}
                          </div>
                        </div>
                      </div>
                      <Link href="/contact">
                        <Button variant="gradient">Apply</Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{opening.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Don't See a Fit?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                We're always looking for talented individuals. Send us your resume and we'll keep you in mind 
                for future opportunities.
              </p>
              <div className="flex gap-4">
                <Link href="/contact">
                  <Button variant="gradient">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Resume
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="outline">Contact HR</Button>
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
