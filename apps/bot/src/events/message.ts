import { Events } from 'discord.js';
import { DiscordEvent } from '@/utils/types';
import botProvider from '@/index';
import { BOT_CONFIG } from 'shared/config';

const PREFIX = BOT_CONFIG.prefix;

export const messageCreate: DiscordEvent<Events.MessageCreate> = {
  name: Events.MessageCreate,
  async on(message) {
    // Check for prefix and add it to the queue
    if (message.content.startsWith(PREFIX)) {
      const commandController = (await botProvider).getTaskManager().commandController;
      commandController.addTask(message);
    }
  },
};
