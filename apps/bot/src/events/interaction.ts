import { Events } from 'discord.js';
import { DiscordEvent } from '@utils/types';
import commandController from '@/controllers/commandController';
import { withEventLogging } from '@/utils';

export const interactionCreate: DiscordEvent<Events.InteractionCreate> = {
  name: Events.InteractionCreate,
  on: withEventLogging('interactionCreate', async (interaction) => {
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
      commandController.addTask(interaction);
    }
  }),
};
