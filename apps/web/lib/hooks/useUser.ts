import useSWR from 'swr';
import { TBotApi } from 'shared/types';
import { useEffect, useRef } from 'react';
import { PUBLIC_API_URL } from 'shared/config';
import { getCookie } from 'cookies-next';

const userEndpoint = () => `${PUBLIC_API_URL}/discord/user`;

export default function useUser() {
  const mounted = useRef(false);
  const { data: user, mutate: mutateUser } = useSWR<TBotApi.UserData>(
    getCookie('token') ? userEndpoint() : null,
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
