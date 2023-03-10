import { TBotApi } from '@lib/types';
import fetchJson from '@lib/fetch';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCookie } from 'cookies-next';
import { PUBLIC_API_URL } from 'shared/config';

const codeEndpoint = `${PUBLIC_API_URL}/auth/code`;

export async function fetchAuth(code: string, opts?: RequestInit) {
  return await fetchJson<TBotApi.AuthData>(codeEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
    cache: 'force-cache',
    ...opts,
  });
}

export type AuthData = { isLogged: boolean } & TBotApi.AuthData;

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
