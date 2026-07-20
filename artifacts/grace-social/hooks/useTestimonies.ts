import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

export interface Testimony {
  id: number;
  title: string;
  content: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_id: number;
  display_name: string;
  username: string;
  color: string;
  avatar_url: string | null;
  is_liked: boolean;
}

export interface TestimonyComment {
  id: number;
  content: string;
  created_at: string;
  user_id: number;
  display_name: string;
  username: string;
  color: string;
  avatar_url: string | null;
}

function getApiBase(): string {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (apiUrl) return apiUrl;
  return 'http://localhost:3000/api';
}

async function apiFetch(
  path: string,
  options: { method?: string; body?: object; token?: string | null } = {}
) {
  const base = getApiBase();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.token) headers['Authorization'] = `Bearer ${options.token}`;
  try {
    const res = await fetch(`${base}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: 'Network error.' } };
  }
}

export function useTestimonies() {
  const { authToken } = useAuth();
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTestimonies = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await apiFetch('/testimonies', { token: authToken });
    if (res.ok) {
      setTestimonies(res.data.testimonies ?? []);
    } else {
      setError((res.data.error as string) ?? 'Failed to load testimonies.');
    }
    setLoading(false);
  }, [authToken]);

  useEffect(() => {
    fetchTestimonies();
  }, [fetchTestimonies]);

  const toggleLike = useCallback(
    async (id: number) => {
      if (!authToken) return;
      // Optimistic update
      setTestimonies((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                is_liked: !t.is_liked,
                likes_count: t.is_liked ? t.likes_count - 1 : t.likes_count + 1,
              }
            : t
        )
      );
      const res = await apiFetch(`/testimonies/${id}/like`, {
        method: 'POST',
        token: authToken,
      });
      if (res.ok) {
        setTestimonies((prev) =>
          prev.map((t) =>
            t.id === id
              ? { ...t, is_liked: res.data.liked as boolean, likes_count: res.data.likes_count as number }
              : t
          )
        );
      } else {
        // Revert on failure
        setTestimonies((prev) =>
          prev.map((t) =>
            t.id === id
              ? {
                  ...t,
                  is_liked: !t.is_liked,
                  likes_count: t.is_liked ? t.likes_count - 1 : t.likes_count + 1,
                }
              : t
          )
        );
      }
    },
    [authToken]
  );

  const fetchComments = useCallback(
    async (id: number): Promise<TestimonyComment[]> => {
      const res = await apiFetch(`/testimonies/${id}/comments`, { token: authToken });
      return res.ok ? (res.data.comments as TestimonyComment[]) ?? [] : [];
    },
    [authToken]
  );

  const addComment = useCallback(
    async (id: number, content: string): Promise<TestimonyComment | null> => {
      if (!authToken) return null;
      const res = await apiFetch(`/testimonies/${id}/comments`, {
        method: 'POST',
        token: authToken,
        body: { content },
      });
      if (res.ok) {
        setTestimonies((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, comments_count: t.comments_count + 1 } : t
          )
        );
        return res.data.comment as TestimonyComment;
      }
      return null;
    },
    [authToken]
  );

  const addTestimony = useCallback(
    async (title: string, content: string): Promise<boolean> => {
      if (!authToken) return false;
      const res = await apiFetch('/testimonies', {
        method: 'POST',
        token: authToken,
        body: { title, content },
      });
      if (res.ok) {
        await fetchTestimonies();
        return true;
      }
      return false;
    },
    [authToken, fetchTestimonies]
  );

  return {
    testimonies,
    loading,
    error,
    toggleLike,
    fetchComments,
    addComment,
    addTestimony,
    refresh: fetchTestimonies,
  };
}
