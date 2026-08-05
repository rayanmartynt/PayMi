'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new /auth/login route
    router.replace('/auth/login');
  }, [router]);

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Redirecting...
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          If you are not redirected automatically, please click{' '}
          <a href="/auth/login" className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500">
            here
          </a>
          .
        </p>
      </div>
    </div>
  );
}
