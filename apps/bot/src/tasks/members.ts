import { getGuild } from './guild';

export async function getGuildMember(guildId: string, userId: string) {
  const guild = await getGuild(guildId);
  if (!guild) return null;
  return guild.members.cache.get(userId);
}
