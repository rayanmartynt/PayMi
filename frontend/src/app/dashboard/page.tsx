'use client'

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ArrowUpRight, ArrowDownRight, TrendingUp, Wallet, CheckCircle, XCircle, Clock, AlertTriangle, ArrowRight } from 'lucide-react'
import { api } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { formatCurrency } from '@/lib/utils'
import { RevenueChart } from '@/features/dashboard/components/RevenueChart'
import { TransactionsTable } from '@/features/dashboard/components/TransactionsTable'
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

function StatCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseX = useSpring(x, { stiffness: 500, damping: 100 })
  const mouseY = useSpring(y, { stiffness: 500, damping: 100 })

  const rotateX = useTransform(mouseY, [-0.5, 0.5], [8, -8])
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-8, 8])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseXVal = (e.clientX - rect.left) / width - 0.5
    const mouseYVal = (e.clientY - rect.top) / height - 0.5
    x.set(mouseXVal)
    y.set(mouseYVal)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={cardRef}
      style={{
        perspective: 1000,
        rotateX,
        rotateY,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
    >
      <Card className="hover:shadow-xl transition-all duration-300 transform-style-3d">
        {children}
      </Card>
    </motion.div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [onboardingStep, setOnboardingStep] = useState<string>('COMPLETED');

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch merchant profile
        const merchant = await api.getMerchantProfile();
        setOnboardingStep(merchant.onboardingStep || 'COMPLETED');
        
        // Fetch analytics
        let analytics: any = {
          dailyRevenue: [],
          revenue: 0,
          transactions: 0
        };
        try {
          analytics = await api.getAnalytics();
        } catch (err: any) {
          console.log('No analytics data yet:', err);
        }

        // Fetch transactions
        let transactions: any[] = [];
        try {
          const transactionsData: any = await api.getTransactions();
          transactions = transactionsData.transactions || [];
        } catch (err: any) {
          console.log('No transactions yet:', err);
        }

        setData({ analytics, transactions, merchant });
      } catch (err: any) {
        console.error('Failed to fetch dashboard data', err);
        setError(err.message || 'Failed to load dashboard data');
      }
    }
    fetchData();
  }, []);

  if (error) return <div className="text-red-500">Error loading data: {error}</div>;
  if (!data) return <div className="flex items-center justify-center h-64"><span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></span> Loading...</div>;

  const { analytics, transactions, merchant } = data;

  const todayRevenue = analytics.dailyRevenue[analytics.dailyRevenue.length - 1]?.amount || 0
  const yesterdayRevenue = analytics.dailyRevenue[analytics.dailyRevenue.length - 2]?.amount || 0
  const revenueChange = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0

  const successfulPayments = transactions.filter((t: any) => t.status === 'successful').length;
  const failedPayments = transactions.filter((t: any) => t.status === 'failed').length;
  const pendingPayments = transactions.filter((t: any) => t.status === 'pending').length;
  const totalPayments = successfulPayments + failedPayments + pendingPayments;
  const successRate = totalPayments ? (successfulPayments / totalPayments) * 100 : 0;

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Verification Status Banner */}
        {(!merchant.emailVerified || !merchant.phoneVerified) && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">Complete Your Verification</h3>
                <p className="text-white/90 text-sm mb-3">
                  {!merchant.emailVerified && !merchant.phoneVerified 
                    ? 'You need to verify both your email and phone number to perform transactions.'
                    : !merchant.emailVerified 
                    ? 'You need to verify your email to perform transactions.'
                    : 'You need to verify your phone number to perform transactions.'}
                </p>
                <div className="flex gap-3">
                  {!merchant.emailVerified && (
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        try {
                          await api.resendVerificationCode();
                          toast.success('Verification code sent to your email');
                        } catch (error: any) {
                          toast.error(error.message || 'Failed to send verification code');
                        }
                      }}
                      className="bg-white text-amber-600 hover:bg-white/90"
                    >
                      Verify Email
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                  {!merchant.phoneVerified && (
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        try {
                          await api.sendPhoneVerification();
                          toast.success('Verification code sent to your phone');
                          router.push(`/auth/verify-phone?dashboard=true`);
                        } catch (error: any) {
                          toast.error(error.message || 'Failed to send verification code');
                        }
                      }}
                      className="bg-white text-amber-600 hover:bg-white/90"
                    >
                      Verify Phone
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Onboarding Banner */}
        {onboardingStep !== 'COMPLETED' && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">Complete Your Business Verification</h3>
                <p className="text-white/90 text-sm mb-3">
                  Finish your business verification to start accepting payments and unlock all merchant features.
                </p>
                <Button
                  variant="secondary"
                  onClick={() => router.push('/onboarding')}
                  className="bg-white text-blue-600 hover:bg-white/90"
                >
                  Complete Verification
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {merchant.name}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(todayRevenue)}</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                {revenueChange >= 0 ? (
                  <>
                    <ArrowUpRight className="h-3 w-3 mr-1 text-green-500" />
                    <span className="text-green-500">+{revenueChange.toFixed(1)}%</span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="h-3 w-3 mr-1 text-red-500" />
                    <span className="text-red-500">{revenueChange.toFixed(1)}%</span>
                  </>
                )}
                <span className="ml-1">from yesterday</span>
              </p>
            </CardContent>
          </StatCard>

          <StatCard>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.transactions}</div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </StatCard>

          <StatCard>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">{successfulPayments} successful</p>
            </CardContent>
          </StatCard>

          <StatCard>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics.revenue)}</div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </StatCard>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueChart data={analytics.dailyRevenue} />
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Payment Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Successful</span>
                </div>
                <Badge variant="success">{successfulPayments}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">Pending</span>
                </div>
                <Badge variant="warning">{pendingPayments}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Failed</span>
                </div>
                <Badge variant="destructive">{failedPayments}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionsTable transactions={transactions.slice(0, 5)} />
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
