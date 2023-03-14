import { PUBLIC_API_URL } from 'shared/config';
import { TDiscord } from 'shared/types';
import useSWR from 'swr';

const rolesEndpoint = (guildId: string) => `${PUBLIC_API_URL}/guilds/${guildId}/roles`;

export default function useRoles({ guildId }: { guildId: string }) {
  const { data: roles, mutate: mutateRoles } = useSWR<TDiscord.RoleData[]>(rolesEndpoint(guildId), {
    revalidateOnFocus: false,
  });

  return { roles, mutateRoles };
}
