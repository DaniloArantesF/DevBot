import { Events } from 'discord.js';
import { DiscordEvent } from '@/utils/types';
import { withEventLogging } from '@/utils';

export const guildMemberAdd: DiscordEvent<Events.GuildMemberAdd> = {
  name: Events.GuildMemberAdd,
  on: withEventLogging('guildMemberAdd', async (member) => {}),
};

export const guildMemberUpdate: DiscordEvent<Events.GuildMemberUpdate> = {
  name: Events.GuildMemberUpdate,
  on: withEventLogging('guildMemberUpdate', async (oldMember, newMember) => {}),
};

export const guildMemberRemove: DiscordEvent<Events.GuildMemberRemove> = {
  name: Events.GuildMemberRemove,
  on: withEventLogging('guildMemberRemove', async (member) => {}),
};
