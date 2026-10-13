/**
 * Centralized API configuration and request routing for StudyOS Mobile.
 * In Capacitor Android/iOS, local assets are served from https://localhost or capacitor://localhost.
 * Any relative fetch to '/api/...' must be directed to the remote backend at API_BASE_URL.
 */

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  'https://studyos-snowy.vercel.app'
).replace(/\/$/, '');

/**
 * Returns a fully-qualified URL for any API endpoint.
 * E.g., apiUrl('/api/user/me') => 'https://studyos-snowy.vercel.app/api/user/me'
 */
export function apiUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

/**
 * Fetch wrapper that guarantees the target is prefixed with API_BASE_URL.
 */
export async function apiFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  if (typeof input === 'string') {
    return fetch(apiUrl(input), init);
  }
  return fetch(input, init);
}

let interceptorInstalled = false;

/**
 * Installs a global window.fetch interceptor on application startup.
 * Automatically rewrites any relative '/api/...' request to point to the remote production backend.
 * This guarantees that even if a component calls raw fetch('/api/...'), it never targets https://localhost.
 */
export function setupGlobalFetchInterceptor(): void {
  if (interceptorInstalled || typeof window === 'undefined') return;
  interceptorInstalled = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    try {
      if (typeof input === 'string') {
        if (input.startsWith('/api/') || input === '/api') {
          return await originalFetch(apiUrl(input), init);
        }
      } else if (input instanceof URL) {
        if (input.pathname.startsWith('/api')) {
          const newUrl = new URL(apiUrl(input.pathname + input.search), API_BASE_URL);
          return await originalFetch(newUrl, init);
        }
      } else if (typeof Request !== 'undefined' && input instanceof Request) {
        const urlStr = input.url;
        try {
          const parsed = new URL(urlStr, window.location.href);
          if (parsed.pathname.startsWith('/api')) {
            const newTarget = apiUrl(parsed.pathname + parsed.search);
            const newRequest = new Request(newTarget, input);
            return await originalFetch(newRequest, init);
          }
        } catch {
          // If URL parsing fails, proceed with original
        }
      }
    } catch (err) {
      console.warn('[StudyOS API Interceptor] Error intercepting fetch call:', err);
    }

    return await originalFetch(input, init);
  };

  console.log('[StudyOS Mobile] Global fetch interceptor initialized -> Backend:', API_BASE_URL);
}
