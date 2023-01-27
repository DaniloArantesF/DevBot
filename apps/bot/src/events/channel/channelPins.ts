import { Events } from 'discord.js';
import { DiscordEvent } from '@/utils/types';
import { stringifyCircular } from '@/utils';
import { EventLog } from '@/tasks/logs';

export const channelPinsUpdate: DiscordEvent<Events.ChannelPinsUpdate> = {
  name: Events.ChannelPinsUpdate,
  async on(channel, date) {
    return EventLog('channelPinsUpdate', stringifyCircular({ channel, date }));
  },
};
