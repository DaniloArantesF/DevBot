import useSWR, { mutate } from 'swr';
import { TBotApi } from '@lib/types';
import fetchJson from '@lib/fetch';
import { useEffect, useRef } from 'react';
import { PUBLIC_API_URL } from 'shared/config';
import { getCookie } from 'cookies-next';

const guildEndpoint = (guildId: string, token: string) =>
  `${PUBLIC_API_URL}/discord/guilds/${guildId}?token=${token}`;
const guildsEndpoint = (token: string) => `${PUBLIC_API_URL}/discord/guilds?token=${token}`;

export async function fetchGuild(guildId: string, token: string) {
  const data = await fetchJson<TBotApi.GuildData>(guildEndpoint(guildId, token), {
    method: 'GET',
    credentials: 'include',
  });
  return data;
}

export async function fetchGuilds(token: string) {
  const data = await fetchJson<TBotApi.GuildData[]>(guildsEndpoint(token), {
    method: 'GET',
    credentials: 'include',
  });
  return data;
}

export default function useGuilds() {
  const mounted = useRef(false);
  const { data: guilds, mutate: mutateGuilds } = useSWR<TBotApi.GuildData[]>(
    getCookie('token') ? guildsEndpoint(getCookie('token') as string) : null,
    {
      revalidateOnMount: false,
      revalidateOnFocus: false,
    },
  );

  useEffect(() => {
    if (!mounted.current) {
      mutateGuilds();
    }

    return () => {
      mounted.current = true;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { guilds, mutateGuilds };
}
