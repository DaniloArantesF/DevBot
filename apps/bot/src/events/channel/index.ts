import { Events } from 'discord.js';
import { DiscordEvent } from '@/utils/types';
import { stringifyCircular } from '@/utils';
import { EventLog } from '@/tasks/logs';

export const channelCreate: DiscordEvent<Events.ChannelCreate> = {
  name: Events.ChannelCreate,
  async on(channel) {
    return EventLog('channelCreate', stringifyCircular({ channel }));
  },
};

export const channelDelete: DiscordEvent<Events.ChannelDelete> = {
  name: Events.ChannelDelete,
  async on(channel) {
    return EventLog('channelDelete', stringifyCircular({ channel }));
  },
};

export const channelUpdate: DiscordEvent<Events.ChannelUpdate> = {
  name: Events.ChannelUpdate,
  async on(oldChannel, newChannel) {
    return EventLog('channelUpdate', stringifyCircular({ oldChannel, newChannel }));
  },
};
