import { Events } from 'discord.js';
import { Event } from '.';
import taskManager from '../TaskManager';

export const event: Event<Events.InteractionCreate> = {
  name: Events.InteractionCreate,
  async on(interaction) {
    if (!interaction.isChatInputCommand()) {
      console.log(interaction);
      return;
    };

    // Prevent interaction timeout
    await interaction.deferReply();

    // Push interactions to task queue
    await taskManager.addCommandInteraction(interaction);
  },
};
