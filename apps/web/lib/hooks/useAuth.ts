import { TBotApi } from '@lib/types';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCookie } from 'cookies-next';
import { PUBLIC_API_URL } from 'shared/config';

const codeEndpoint = `${PUBLIC_API_URL}/auth/login`;

export async function fetchAuth(code: string, opts?: RequestInit) {
  return (await (
    await fetch(codeEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
      cache: 'force-cache',
      ...opts,
    })
  ).json()) as TBotApi.Session;
}

export type AuthData = { isLogged: boolean } & TBotApi.Session;

// TODO: refresh tokens
export default function useAuth() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isClient = typeof window !== 'undefined';
  const [authData, setAuthData] = useState<AuthData>({
    isLogged: !!getCookie('token'),
    token: (getCookie('token') as string) || '',
    expiresAt: Number(getCookie('expiresAt')) || -1,
  });

  return {
    ...authData,
  };
}
