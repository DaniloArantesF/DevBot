import useSWR, { mutate } from 'swr';
import { TBotApi } from '@lib/types';
import fetchJson from '@lib/fetch';
import { useEffect, useRef } from 'react';
import { PUBLIC_API_URL } from 'shared/config';
import { getCookie } from 'cookies-next';

const guildEndpoint = (guildId: string) =>
  `${PUBLIC_API_URL}/discord/guilds/${guildId}`;
const guildsEndpoint = () => `${PUBLIC_API_URL}/discord/user/guilds`;

export async function fetchGuild(guildId: string, token: string) {
  const data = await fetchJson<TBotApi.GuildData>(guildEndpoint(guildId), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    }
  });
  return data;
}

export async function fetchGuilds(token: string) {
  const data = await fetchJson<TBotApi.GuildData[]>(guildsEndpoint(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    }
  });
  return data;
}

export default function useGuilds() {
  const mounted = useRef(false);
  const { data: guilds, mutate: mutateGuilds } = useSWR<TBotApi.GuildData[]>(
    getCookie('token') ? guildsEndpoint() : null,
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
