'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  kycStatus?: string;
  verified: boolean;
  profilePicture?: string;
  customer?: {
    id: string;
    name?: string;
    profilePicture?: string;
  };
  merchant?: {
    id: string;
    businessName: string;
    businessType: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ user: User; token: string }>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('[Auth] Checking auth, token exists:', !!token);
      
      if (token) {
        // Validate token format before using it
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length !== 3) {
            throw new Error('Invalid token format');
          }
          
          // Decode token to check if it's expired
          const payload = JSON.parse(atob(tokenParts[1]));
          const now = Math.floor(Date.now() / 1000);
          console.log('[Auth] Token payload:', { userId: payload.userId || payload.id, exp: payload.exp, now });
          
          if (payload.exp && payload.exp < now) {
            throw new Error('Token expired');
          }
        } catch (e) {
          console.error('[Auth] Token validation failed:', e);
          localStorage.clear();
          setUser(null);
          setLoading(false);
          return;
        }

        api.setToken(token);
        const profile = await api.getProfile() as User;
        console.log('[Auth] Profile loaded:', { profileId: profile.id, profileName: profile.name });
        
        // Verify the token matches the returned user
        if (profile && profile.id) {
          // Additional check: ensure the token's userId matches the profile ID
          const tokenParts = token.split('.');
          const payload = JSON.parse(atob(tokenParts[1]));
          const tokenUserId = payload.userId || payload.id;
          
          console.log('[Auth] Comparing IDs:', { tokenUserId, profileId: profile.id });
          
          if (tokenUserId !== profile.id) {
            console.error('[Auth] Token userId mismatch:', { tokenUserId, profileId: profile.id });
            localStorage.clear();
            setUser(null);
            return;
          }
          
          setUser(profile);
        } else {
          throw new Error('Invalid profile data');
        }
      }
    } catch (error) {
      console.error('[Auth] Auth check failed:', error);
      // Clear all localStorage data on auth failure to prevent cross-user contamination
      localStorage.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await api.login(email, password);
    setUser(response.user);
    return response;
  };

  const register = async (data: any) => {
    await api.register(data);
  };

  const logout = () => {
    api.logout();
    setUser(null);
    // Clear all auth-related data from localStorage
    if (typeof window !== 'undefined') {
      localStorage.clear();
      // Redirect to login page
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
