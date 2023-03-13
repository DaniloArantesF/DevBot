import useSWR from 'swr';
import { TBotApi } from 'shared/types';
import fetchJson from '@lib/fetch';
import { useEffect, useRef } from 'react';
import { PUBLIC_API_URL } from 'shared/config';
import { getCookie } from 'cookies-next';

const userEndpoint = (token: string) => `${PUBLIC_API_URL}/discord/user?token=${token}`;

export async function fetchUser(token: string) {
  return await fetchJson<TBotApi.UserData>(userEndpoint(token), { credentials: 'include' });
}

// TODO: refresh tokens
export default function useUser() {
  const mounted = useRef(false);
  const { data: user, mutate: mutateUser } = useSWR<TBotApi.UserData>(
    getCookie('token') ? userEndpoint(getCookie('token') as string) : null,
    {
      revalidateOnFocus: false,
      revalidateOnMount: false,
    },
  );

  useEffect(() => {
    if (!mounted.current) {
      mutateUser();
    }

    return () => {
      mounted.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { user, mutateUser };
}
