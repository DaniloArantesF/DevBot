import { Events, Interaction } from 'discord.js';
import { DiscordEvent } from '@utils/types';
import botProvider from '@/index';

export const interactionCreate: DiscordEvent<Events.InteractionCreate> = {
  name: Events.InteractionCreate,
  async on(interaction) {
    // TODO: Check if user exists in pocketbase if not create it

    if (interaction.isRepliable()) {
      // Prevent interaction timeout
      await interaction.deferReply();
    }

    if (
      interaction.isChatInputCommand() ||
      interaction.isMessageComponent() ||
      interaction.isContextMenuCommand()
    ) {
      // Push interactions to task queue
      (await botProvider).getTaskManager().commandController.addTask(interaction);
    }
  },
};
