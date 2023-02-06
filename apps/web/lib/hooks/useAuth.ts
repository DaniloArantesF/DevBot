'use client';
import { ApiAuthResponse } from '@lib/types';
import fetchJson from '@lib/fetch';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCookie } from 'cookies-next';

const codeEndpoint = `http://localhost:8000/auth/code`;

export async function fetchAuth(code: string, opts?: RequestInit) {
  return await fetchJson<ApiAuthResponse>(codeEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
    cache: 'force-cache',
    ...opts,
  });
}

export type AuthData = { isLogged: boolean } & ApiAuthResponse;

export default function useAuth() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isClient = typeof window !== 'undefined';
  const [authData, setAuthData] = useState<AuthData>({
    isLogged: !!getCookie('accessToken'),
    accessToken: (getCookie('accessToken') as string) || '',
    refreshToken: (getCookie('refreshToken') as string) || '',
    expiresAt: Number(0) || 0,
    scope: '',
    tokenType: '',
  });

  return {
    ...authData,
  };
}
