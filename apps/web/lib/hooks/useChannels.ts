import useSWR, { mutate } from 'swr';
import { TBotApi } from '@lib/types';
import { useEffect, useRef } from 'react';
import { PUBLIC_API_URL } from 'shared/config';
import { getCookie } from 'cookies-next';
import fetchJson from '@lib/fetch';

const channelsEndpoint = (guildId: string) =>
  `${PUBLIC_API_URL}/discord/guilds/${guildId}/channels`;

export async function fetchGuildChannels(guildId: string) {
  const data = await fetchJson<TBotApi.ChannelData[]>(channelsEndpoint(guildId), {
    method: 'GET',
  });
  return data;
}

export default function useChannels(guildId: string | null) {
  const mounted = useRef(false);
  const { data: channels, mutate: mutateChannels } = useSWR<TBotApi.GuildData[]>(
    getCookie('token') && guildId ? channelsEndpoint(guildId) : null,
    {
      // revalidateOnMount: false,
      revalidateOnFocus: false,
    },
  );

  useEffect(() => {
    if (!mounted.current) {
      mutateChannels();
    }

    return () => {
      mounted.current = true;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { channels, mutateChannels };
}
