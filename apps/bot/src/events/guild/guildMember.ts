import { Events } from 'discord.js';
import { DiscordEvent } from '@/utils/types';
import { stringifyCircular } from '@/utils';
import { EventLog } from '@/tasks/logs';

export const guildMemberAdd: DiscordEvent<Events.GuildMemberAdd> = {
  name: Events.GuildMemberAdd,
  async on(member) {
    return EventLog('guildMemberAdd', stringifyCircular({ member }));
  },
};

export const guildMemberUpdate: DiscordEvent<Events.GuildMemberUpdate> = {
  name: Events.GuildMemberUpdate,
  async on(oldMember, newMember) {
    return EventLog('guildMemberUpdate', stringifyCircular({ oldMember, newMember }));
  },
};

export const guildMemberRemove: DiscordEvent<Events.GuildMemberRemove> = {
  name: Events.GuildMemberRemove,
  async on(member) {
    return EventLog('guildMemberRemove', stringifyCircular({ member }));
  },
};
