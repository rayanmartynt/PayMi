'use client'

import MerchantOnboardingWizard from '@/components/onboarding/MerchantOnboardingWizard'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function OnboardingPage() {
  return (
    <ProtectedRoute>
      <MerchantOnboardingWizard />
    </ProtectedRoute>
  )
}
