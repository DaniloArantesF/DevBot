import { DiscordCommand } from '@/utils/types';
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getCommands, replyInteraction } from '@/tasks/commands';

// Builds the full help embed
const HelpEmbed = (commandsData: DiscordCommand[]) => {
  const fields = [];
  for (const command of commandsData) {
    fields.push({
      name: `/${command.data.name}`,
      value: `${command.data.description}`,
    });
  }

  return new EmbedBuilder()
    .setColor('#b700ff')
    .setTitle('Bot Commands :scroll:')
    .setThumbnail(
      'https://media1.tenor.com/images/75f1a082d67bcd34cc4960131e905bed/tenor.gif?itemid=5505046',
    )
    .addFields(...fields)
    .setFooter({ text: "To get more info on a command use '/help <command>'" });
};

// Builds the help embed for a specific command
export const CommandHelpEmbed = (command: DiscordCommand) => {
  return new EmbedBuilder()
    .setColor('#b700ff')
    .setTitle(`/${command.data.name}`)
    .setDescription(command.data.description)
    .addFields(
      { name: 'Usage', value: command.usage || 'No usage provided' },
      { name: 'Aliases', value: command.aliases?.join(', ') || 'No aliases provided' },
      { name: 'Permissions', value: command.permissions?.join(', ') || 'No permissions required' },
    );
};

export const command: DiscordCommand = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Displays help for all or a specific command')
    .addStringOption((option) =>
      option.setName('command').setDescription('The command to get help for').setRequired(false),
    ),
  async messageHandler(interaction) {
    const commandsData = await getCommands();
    const arg = interaction.content.split(' ')[1];

    let reply = { embeds: [HelpEmbed(commandsData)] };
    let command = null;
    if (arg) {
      command = commandsData.find((c) => c.data.name === arg || c.aliases?.includes(arg as string));

      if (!command) {
        await replyInteraction(interaction, `Command ${arg} not found`);
        return;
      }
      reply = { embeds: [CommandHelpEmbed(command)] };
    }

    await replyInteraction(interaction, reply);

    return {
      user: interaction.member.user.id,
      guild: interaction.guildId,
      channel: interaction.channelId,
      command: 'help',
      args: command ? [command.data?.name] : [],
      reply: 'Success',
    };
  },
  async execute(interaction) {
    const commandsData = await getCommands();

    const arg = interaction.options.get('command', false)?.value;

    let reply = { embeds: [HelpEmbed(commandsData)] };
    let command = null;

    if (arg) {
      command = commandsData.find((c) => c.data.name === arg || c.aliases?.includes(arg as string));

      if (!command) {
        await replyInteraction(interaction, `Command ${arg} not found`);
        return;
      }
      reply = { embeds: [CommandHelpEmbed(command)] };
    }

    await replyInteraction(interaction, reply);

    return {
      user: interaction.member.user.id,
      guild: interaction.guildId,
      channel: interaction.channelId,
      command: 'help',
      args: command ? [command.data.name] : [],
      reply: 'Success',
    };
  },
  usage: '/help <command?>',
  aliases: ['h', 'halp'],
};
