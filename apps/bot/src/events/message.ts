import { Events } from 'discord.js';
import { DiscordEvent } from '@/utils/types';
import { BOT_CONFIG } from 'shared/config';
import commandController from '@/controllers/commandController';
import { EventLog } from '@/tasks/logs';
import { stringifyCircular, withEventLogging } from '@/utils';
import { withApiLogging } from '@/api/decorators/log';

const PREFIX = BOT_CONFIG.prefix;

export const messageCreate: DiscordEvent<Events.MessageCreate> = {
  name: Events.MessageCreate,
  async on(message) {
    // Check for prefix and add it to the queue
    if (message.content.startsWith(PREFIX)) {
      commandController.addTask(message);
    }
  },
};

export const messageReactionAdd: DiscordEvent<Events.MessageReactionAdd> = {
  name: Events.MessageReactionAdd,
  on: withEventLogging('messageReactionAdd', async (message, user) => {}),
};

export const messageReactionRemove: DiscordEvent<Events.MessageReactionRemove> = {
  name: Events.MessageReactionRemove,
  on: withEventLogging('messageReactionAdd', async (message, user) => {}),
};
