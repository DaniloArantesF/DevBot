import botProvider from '../index';

export async function getUserRoles(userId: string, guildId: string) {
  const client = (await botProvider).getDiscordClient();
  const guild = client.guilds.cache.get(guildId);
  const member = guild.members.cache.get(userId);
  return member.roles.cache;
}

export async function setUserRoles(guildId: string, userId: string, roles: string[]) {
  const client = (await botProvider).getDiscordClient();
  const guild = client.guilds.cache.get(guildId);
  const member = guild.members.cache.get(userId);
  return member.roles.set(roles.map((role) => guild.roles.cache.get(role)));
}

export async function getGuildRoles(guildId: string) {
  const client = (await botProvider).getDiscordClient();
  const guild = client.guilds.cache.get(guildId);
  return guild.roles.cache;
}

export async function addUserRole(userId: string, guildId: string, roleId: string) {
  const client = (await botProvider).getDiscordClient();
  const guild = client.guilds.cache.get(guildId);
  const member = guild.members.cache.get(userId);
  const role = guild.roles.cache.get(roleId);
  return await member.roles.add(role);
}

export async function removeUserRole(userId: string, guildId: string, roleId: string) {
  const client = (await botProvider).getDiscordClient();
  const guild = client.guilds.cache.get(guildId);
  const member = guild.members.cache.get(userId);
  const role = guild.roles.cache.get(roleId);
  await member.roles.remove(role);
}

export async function getGuildRole(guildId: string, roleId?: string, roleName?: string) {
  const client = (await botProvider).getDiscordClient();
  const guild = client.guilds.cache.get(guildId);
  if (roleName) return guild.roles.cache.find((role) => role.name === roleName).toJSON();
  return guild.roles.cache.get(roleId);
}

export async function hasRole(userId: string, guildId: string, roleId: string) {
  const client = (await botProvider).getDiscordClient();
  const guild = client.guilds.cache.get(guildId);
  const member = guild.members.cache.get(userId);
  const role = guild.roles.cache.get(roleId);
  return member.roles.cache.has(role.id);
}
