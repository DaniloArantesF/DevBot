import { Events, Interaction } from 'discord.js';
import { DiscordEvent } from '@utils/types';
import botProvider from '@/index';

const interactionRouter = {
  chatInput: (interaction: Interaction) => interaction.isChatInputCommand(),
  contextMenu: (interaction: Interaction) => interaction.isContextMenuCommand(),
};

export const event: DiscordEvent<Events.InteractionCreate> = {
  name: Events.InteractionCreate,
  async on(interaction) {
    if (interaction.isRepliable()) {
      // Prevent interaction timeout
      await interaction.deferReply();
    }

    // Push interactions to task queue
    (await botProvider).getService('taskManager').addCommandInteraction(interaction);
  },
};
