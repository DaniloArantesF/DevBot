'use client';
import { ApiAuthResponse } from '@lib/types';
import fetchJson from '@lib/fetch';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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

type AuthData = { isLogged: false } | ({ isLogged: true } & ApiAuthResponse);

export default function useAuth() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isClient = typeof window !== 'undefined';
  const [authData, setAuthData] = useState<AuthData>(
    isClient
      ? {
          isLogged: localStorage.getItem('accessToken') !== null,
          accessToken: localStorage.getItem('accessToken') || '',
          refreshToken: localStorage.getItem('refreshToken') || '',
          expiresAt: Number(localStorage.getItem('expiresAt')) || 0,
          scope: '',
          tokenType: '',
        }
      : { isLogged: false },
  );

  // useEffect(() => {
  //   if (isClient && !authData.isLogged) {
  //     localStorage.clear();
  //     return router.push('/login');
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [])

  return {
    ...authData,
  };
}
