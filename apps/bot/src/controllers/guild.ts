import botProvider from '@/index';

export async function getGuild(guildId: string) {
  const client = (await botProvider).getDiscordClient();
  return client.guilds.cache.get(guildId);
}

export async function getGuildByName(guildName: string) {
  const client = (await botProvider).getDiscordClient();
  return client.guilds.cache.find((guild) => guild.name === guildName);
}
