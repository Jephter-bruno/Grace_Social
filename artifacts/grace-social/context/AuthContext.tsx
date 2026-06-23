import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export interface AuthUser {
  id: number;
  name: string;
  displayName: string;
  username: string;
  handle: string;
  email: string;
  bio: string;
  avatarUrl: string | null;
  initials: string;
  color: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
}

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  currentUser: AuthUser | null;
  authToken: string | null;
  login: (emailOrUsername: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (fields: Partial<Pick<AuthUser, 'displayName' | 'username' | 'bio' | 'avatarUrl' | 'color'>>) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  followUser: (userId: number) => Promise<{ success: boolean; followersCount?: number; error?: string }>;
  unfollowUser: (userId: number) => Promise<{ success: boolean; followersCount?: number; error?: string }>;
  refreshCurrentUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'gracesocial_auth_token';

function getApiBase(): string {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (apiUrl) return apiUrl;
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}/api`;
  return 'http://localhost:3000/api';
}

async function apiRequest(
  path: string,
  options: { method?: string; body?: object; token?: string } = {}
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const base = getApiBase();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.token) headers['Authorization'] = `Bearer ${options.token}`;

  try {
    const res = await fetch(`${base}${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: 'Network error. Please check your connection.' } };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (!token) return;

        const res = await apiRequest('/auth/me', { token });
        if (res.ok && res.data.user) {
          setAuthToken(token);
          setCurrentUser(res.data.user as AuthUser);
        } else {
          await AsyncStorage.removeItem(TOKEN_KEY);
        }
      } catch {
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = useCallback(async (emailOrUsername: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!emailOrUsername.trim()) return { success: false, error: 'Please enter your email or username.' };
    if (!password.trim()) return { success: false, error: 'Please enter your password.' };

    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: { emailOrUsername: emailOrUsername.trim(), password },
    });

    if (!res.ok) {
      return { success: false, error: (res.data.error as string) || 'Login failed. Please try again.' };
    }

    const { token, user } = res.data as { token: string; user: AuthUser };
    await AsyncStorage.setItem(TOKEN_KEY, token);
    setAuthToken(token);
    setCurrentUser(user);
    return { success: true };
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!name.trim()) return { success: false, error: 'Please enter your full name.' };
    if (!email.trim()) return { success: false, error: 'Please enter your email address.' };
    if (!password || password.length < 6) return { success: false, error: 'Password must be at least 6 characters.' };

    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: { name: name.trim(), email: email.trim().toLowerCase(), password },
    });

    if (!res.ok) {
      return { success: false, error: (res.data.error as string) || 'Registration failed. Please try again.' };
    }

    const { token, user } = res.data as { token: string; user: AuthUser };
    await AsyncStorage.setItem(TOKEN_KEY, token);
    setAuthToken(token);
    setCurrentUser(user);
    return { success: true };
  }, []);

  const updateProfile = useCallback(async (fields: Partial<Pick<AuthUser, 'displayName' | 'username' | 'bio' | 'avatarUrl' | 'color'>>): Promise<{ success: boolean; error?: string }> => {
    if (!authToken) return { success: false, error: 'Not authenticated.' };

    const res = await apiRequest('/auth/profile', {
      method: 'PATCH',
      body: fields,
      token: authToken,
    });

    if (!res.ok) {
      return { success: false, error: (res.data.error as string) || 'Update failed.' };
    }

    setCurrentUser(res.data.user as AuthUser);
    return { success: true };
  }, [authToken]);

  const logout = useCallback(async () => {
    if (authToken) {
      await apiRequest('/auth/logout', { method: 'POST', token: authToken }).catch(() => {});
    }
    await AsyncStorage.removeItem(TOKEN_KEY);
    setAuthToken(null);
    setCurrentUser(null);
  }, [authToken]);

  const refreshCurrentUser = useCallback(async () => {
    if (!authToken) return;
    const res = await apiRequest('/auth/me', { token: authToken });
    if (res.ok && res.data.user) {
      setCurrentUser(res.data.user as AuthUser);
    }
  }, [authToken]);

  const followUser = useCallback(async (userId: number): Promise<{ success: boolean; followersCount?: number; error?: string }> => {
    if (!authToken) return { success: false, error: 'Not authenticated.' };
    const res = await apiRequest(`/users/${userId}/follow`, { method: 'POST', token: authToken });
    if (!res.ok) return { success: false, error: (res.data.error as string) || 'Follow failed.' };
    await refreshCurrentUser();
    return { success: true, followersCount: res.data.followersCount as number };
  }, [authToken, refreshCurrentUser]);

  const unfollowUser = useCallback(async (userId: number): Promise<{ success: boolean; followersCount?: number; error?: string }> => {
    if (!authToken) return { success: false, error: 'Not authenticated.' };
    const res = await apiRequest(`/users/${userId}/follow`, { method: 'DELETE', token: authToken });
    if (!res.ok) return { success: false, error: (res.data.error as string) || 'Unfollow failed.' };
    await refreshCurrentUser();
    return { success: true, followersCount: res.data.followersCount as number };
  }, [authToken, refreshCurrentUser]);

  return (
    <AuthContext.Provider value={{
      isLoggedIn: currentUser !== null,
      isLoading,
      currentUser,
      authToken,
      login,
      signup,
      updateProfile,
      logout,
      followUser,
      unfollowUser,
      refreshCurrentUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
