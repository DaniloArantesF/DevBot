import { Events } from 'discord.js';
import { DiscordEvent } from '@/utils/types';
import { stringifyCircular } from '@/utils';
import { EventLog } from '@/tasks/logs';

export const guildScheduledEventCreate: DiscordEvent<Events.GuildScheduledEventCreate> = {
  name: Events.GuildScheduledEventCreate,
  async on(guildScheduledEvent) {
    return EventLog('guildScheduledEventCreate', stringifyCircular({ guildScheduledEvent }));
  },
};

export const guildScheduledEventDelete: DiscordEvent<Events.GuildScheduledEventDelete> = {
  name: Events.GuildScheduledEventDelete,
  async on(guildScheduledEvent) {
    return EventLog('guildScheduledEventDelete', stringifyCircular({ guildScheduledEvent }));
  },
};

export const guildScheduledEventUpdate: DiscordEvent<Events.GuildScheduledEventUpdate> = {
  name: Events.GuildScheduledEventUpdate,
  async on(oldGuildScheduledEvent, newGuildScheduledEvent) {
    return EventLog(
      'guildScheduledEventUpdate',
      stringifyCircular({ oldGuildScheduledEvent, newGuildScheduledEvent }),
    );
  },
};

export const guildScheduledEventMemberAdd: DiscordEvent<Events.GuildScheduledEventUserAdd> = {
  name: Events.GuildScheduledEventUserAdd,
  async on(guildScheduledEvent, user) {
    return EventLog('guildScheduledEventUserAdd', stringifyCircular({ user, guildScheduledEvent }));
  },
};

export const guildScheduledEventMemberRemove: DiscordEvent<Events.GuildScheduledEventUserRemove> = {
  name: Events.GuildScheduledEventUserRemove,
  async on(guildScheduledEvent, user) {
    return EventLog(
      'guildScheduledEventUserRemove',
      stringifyCircular({ user, guildScheduledEvent }),
    );
  },
};
