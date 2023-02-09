import fetchJson from '@lib/fetch';
import { TBot } from 'shared/types';
import useSWR from 'swr';
import { BOT_URL } from 'shared/config';

const commandsEndpoint = `${BOT_URL}/bot/commands`;

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
