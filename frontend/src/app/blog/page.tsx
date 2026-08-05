'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Calendar, Clock, ArrowRight, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  
  const posts = [
    {
      id: 1,
      title: 'The Future of Digital Payments in Sierra Leone',
      excerpt: 'Exploring how mobile money and digital payment solutions are transforming Sierra Leone\'s economy and what the future holds.',
      author: 'Hussien Vandy',
      date: 'August 1, 2024',
      readTime: '5 min read',
      category: 'Industry Insights',
      image: 'bg-gradient-to-r from-blue-500 to-purple-500'
    },
    {
      id: 2,
      title: 'How to Integrate SalonePay into Your Website',
      excerpt: 'A step-by-step guide to integrating our payment gateway into your website using our REST API.',
      author: 'Tech Team',
      date: 'July 25, 2024',
      readTime: '8 min read',
      category: 'Tutorial',
      image: 'bg-gradient-to-r from-green-500 to-teal-500'
    },
    {
      id: 3,
      title: 'Understanding Payment Security in West Africa',
      excerpt: 'Learn about the security measures that protect your transactions and how we stay ahead of emerging threats.',
      author: 'Security Team',
      date: 'July 18, 2024',
      readTime: '6 min read',
      category: 'Security',
      image: 'bg-gradient-to-r from-orange-500 to-red-500'
    },
    {
      id: 4,
      title: '5 Tips for Reducing Payment Failed Transactions',
      excerpt: 'Practical strategies to improve your payment success rates and provide a better customer experience.',
      author: 'Customer Success',
      date: 'July 10, 2024',
      readTime: '4 min read',
      category: 'Best Practices',
      image: 'bg-gradient-to-r from-purple-500 to-pink-500'
    },
    {
      id: 5,
      title: 'The Rise of Mobile Money in Sierra Leone',
      excerpt: 'How mobile money platforms have revolutionized financial inclusion and what it means for businesses.',
      author: 'Hussien Vandy',
      date: 'July 3, 2024',
      readTime: '7 min read',
      category: 'Industry Insights',
      image: 'bg-gradient-to-r from-yellow-500 to-orange-500'
    },
    {
      id: 6,
      title: 'SalonePay API v2: What\'s New',
      excerpt: 'Discover the new features and improvements in our latest API release.',
      author: 'Tech Team',
      date: 'June 28, 2024',
      readTime: '6 min read',
      category: 'Product Updates',
      image: 'bg-gradient-to-r from-indigo-500 to-blue-500'
    }
  ]

  const categories = ['All', 'Industry Insights', 'Tutorial', 'Security', 'Best Practices', 'Product Updates']

  const filteredPosts = selectedCategory === 'All' 
    ? posts 
    : posts.filter(post => post.category === selectedCategory)

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-4">Blog</h1>
            <p className="text-xl text-muted-foreground">
              Insights, tutorials, and updates from the SalonePay team
            </p>
          </div>

          <Card className="mb-12">
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-2 justify-center">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={category === selectedCategory ? 'gradient' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="flex flex-col h-full hover:shadow-lg transition-shadow">
                <div className={`h-48 ${post.image} rounded-t-lg`} />
                <CardHeader>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <span className="px-2 py-1 bg-muted rounded-full text-xs">{post.category}</span>
                  </div>
                  <CardTitle className="text-xl line-clamp-2">{post.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-muted-foreground mb-4 line-clamp-3 flex-1">{post.excerpt}</p>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {post.date}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {post.readTime}
                    </div>
                  </div>
                  <Link href="/api-docs">
                    <Button variant="outline" className="w-full">
                      Read More
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Featured Post
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/2">
                  <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg" />
                </div>
                <div className="md:w-1/2">
                  <span className="px-2 py-1 bg-muted rounded-full text-xs mb-2 inline-block">
                    Industry Insights
                  </span>
                  <h3 className="text-2xl font-bold mb-2">
                    The Future of Digital Payments in Sierra Leone
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Exploring how mobile money and digital payment solutions are transforming Sierra Leone's 
                    economy and what the future holds for businesses and consumers alike.
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span>By Hussien Vandy</span>
                    <span>•</span>
                    <span>August 1, 2024</span>
                  </div>
                  <Link href="/api-docs">
                    <Button variant="gradient">
                      Read Article
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
