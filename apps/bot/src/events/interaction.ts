import { Events } from 'discord.js';
import { Event } from '.';
import { botProvider } from '../index';

export const event: Event<Events.InteractionCreate> = {
  name: Events.InteractionCreate,
  async on(interaction) {
    if (!interaction.isChatInputCommand()) {
      console.log(interaction);
      return;
    }

    // Prevent interaction timeout
    await interaction.deferReply();

    // Push interactions to task queue
    (await botProvider).getService('taskManager').addCommandInteraction(interaction);
  },
};
