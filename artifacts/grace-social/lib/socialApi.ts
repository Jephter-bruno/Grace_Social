import { Platform } from 'react-native';

function getApiBase(): string {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (apiUrl) return apiUrl;
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}/api`;
  return 'http://localhost:3000/api';
}

export async function socialRequest<T = any>(
  path: string,
  options: { method?: string; body?: unknown; token?: string } = {},
): Promise<{ ok: boolean; status: number; data: T }> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  try {
    const response = await fetch(`${getApiBase()}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, data: data as T };
  } catch {
    return { ok: false, status: 0, data: { error: 'Network error.' } as T };
  }
}

export async function uploadSocialMedia(
  uri: string,
  type: 'image' | 'video',
  token: string,
): Promise<{ ok: boolean; id?: number; url?: string; error?: string }> {
  try {
    const form = new FormData();
    const extension = type === 'video' ? 'mp4' : 'jpg';
    if (Platform.OS === 'web') {
      const blob = await fetch(uri).then((response) => response.blob());
      form.append('file', blob, `grace-social-${Date.now()}.${extension}`);
    } else {
      form.append('file', {
        uri,
        name: `grace-social-${Date.now()}.${extension}`,
        type: type === 'video' ? 'video/mp4' : 'image/jpeg',
      } as any);
    }
    const response = await fetch(`${getApiBase()}/media`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, id: data.id, url: data.url, error: data.error };
  } catch {
    return { ok: false, error: 'Unable to upload media.' };
  }
}