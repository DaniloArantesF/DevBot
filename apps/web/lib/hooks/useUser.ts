import useSWR from 'swr';
import { TBotApi } from 'shared/types';
import fetchJson from '@lib/fetch';
import { useEffect, useRef } from 'react';

const userEndpoint = (token: string) => `http://localhost:8000/discord/user?token=${token}`;

export async function fetchUser(token: string) {
  return await fetchJson<TBotApi.UserData>(userEndpoint(token));
}

// TODO: refresh tokens
export default function useUser(token: string) {
  const mounted = useRef(false);
  const { data: user, mutate: mutateUser } = useSWR<TBotApi.UserData>(
    token ? userEndpoint(token) : null,
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
