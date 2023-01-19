import useSWR from 'swr';
import { GuildData } from 'types';

export default function useGuilds() {
  const { data: guilds, mutate: mutateGuilds } = useSWR<GuildData[]>('/api/guilds', {
    revalidateOnFocus: false,
  });

  return { guilds, mutateGuilds };
}
