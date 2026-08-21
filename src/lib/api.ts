import { Capacitor } from '@capacitor/core';

export const API_BASE_URL = Capacitor.isNativePlatform()
  ? 'https://studyos-snowy.vercel.app'
  : ''; // Use relative paths for local development and web deployments

export const apiFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  let url = input;
  
  if (typeof url === 'string' && url.startsWith('/')) {
    url = `${API_BASE_URL}${url}`;
  }
  
  return fetch(url, init);
};
