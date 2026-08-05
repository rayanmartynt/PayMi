'use client';

import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';
import { useAuth } from '@/features/auth/AuthContext';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></span>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.replace('/login');
    return null;
  }

  return <>{children}</>;
}
