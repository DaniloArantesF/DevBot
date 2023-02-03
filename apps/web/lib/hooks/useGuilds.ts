import useSWR from 'swr';
import { GuildData } from '@lib/types';
import fetchJson from '@lib/fetch';

const guildEndpoint = (guildId: string, token: string) =>
  `http://localhost:8000/discord/guilds/${guildId}?token=${token}`;
const guildsEndpoint = (token: string) => `http://localhost:8000/discord/guilds?token=${token}`;

export async function fetchGuild(guildId: string, token: string) {
  const data = await fetchJson<GuildData>(guildEndpoint(guildId, token), {
    method: 'GET',
  });
  return data;
}

export async function fetchGuilds(token: string) {
  const data = await fetchJson<GuildData[]>(guildsEndpoint(token), {
    method: 'GET',
  });
  return data;
}

export default function useGuilds(token: string) {
  // const {}
  const { data: guilds, mutate: mutateGuilds } = useSWR<GuildData[]>(guildsEndpoint(token), {
    revalidateOnMount: false,
    revalidateOnFocus: false,
  });

  return { guilds, mutateGuilds };
}
