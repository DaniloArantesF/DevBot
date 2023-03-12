import fetchJson from '@lib/fetch';
import { TBot } from 'shared/types';
import useSWR from 'swr';
import { PUBLIC_API_URL } from 'shared/config';

const commandsEndpoint = `${PUBLIC_API_URL}/bot/commands`;

export async function fetchCommands() {
  const data = await fetchJson<TBot.CommandData[]>(commandsEndpoint, {
    method: 'GET',
  });
  return data;
}

export default function useCommands() {
  const { data: commands, mutate: mutateCommands } = useSWR<TBot.CommandData[]>(commandsEndpoint, {
    revalidateOnFocus: false,
  });

  return { commands, mutateCommands };
}
