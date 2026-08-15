import { afterEach } from 'vitest';
import { clearAll } from '@/services/auth-storage.js';

const apiUrl = import.meta.env.VITE_API_URL as string | undefined;

if (!apiUrl) {
  throw new Error('VITE_API_URL is required to run API integration tests');
}

if (!apiUrl.includes('/api/')) {
  throw new Error('VITE_API_URL must include the API path, such as /api/v1');
}

afterEach(() => {
  clearAll();
  localStorage.clear();
  sessionStorage.clear();
});
