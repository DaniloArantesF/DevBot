import fetchJson from '@lib/fetch';
import { DiscordRoleData } from 'shared/types';
import useSWR from 'swr';

const rolesEndpoint = (guildId: string) => `http://localhost:8000/guilds/${guildId}/roles`;

export async function fetchRoles(guildId: string) {
  const data = await fetchJson<DiscordRoleData[]>(rolesEndpoint(guildId), {
    method: 'GET',
  });
  return data;
}

export default function useRoles({ guildId }: { guildId: string }) {
  const { data: roles, mutate: mutateRoles } = useSWR<DiscordRoleData[]>(rolesEndpoint(guildId), {
    revalidateOnFocus: false,
  });

  return { roles, mutateRoles };
}
