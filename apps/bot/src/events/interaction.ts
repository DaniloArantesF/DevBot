import { Events, Interaction } from 'discord.js';
import { DiscordEvent } from '@utils/types';
import botProvider from '@/index';

const interactionRouter = {
  chatInput: (interaction: Interaction) => interaction.isChatInputCommand(),
  contextMenu: (interaction: Interaction) => interaction.isContextMenuCommand(),
};

export const interactionCreate: DiscordEvent<Events.InteractionCreate> = {
  name: Events.InteractionCreate,
  async on(interaction) {
    if (interaction.isRepliable()) {
      // Prevent interaction timeout
      await interaction.deferReply();
    }

    if (interaction.isChatInputCommand()) {
      // Push interactions to task queue
      (await botProvider).getTaskManager().commandController.addTask(interaction);
    }
    // TODO: other commands types
  },
};
