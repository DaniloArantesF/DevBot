import type { CommandInteraction, Message, MessageComponentInteraction } from 'discord.js';
import { TDiscord } from './discord';
import { TCache } from './cache';

declare namespace TBot {
  type CommandHandler = SlashCommandHandler | ButtonCommandHandler | MessageCommandHandler;

  type SlashCommandHandler = (interaction: CommandInteraction) => Promise<void | TCache.Command>;

  type ButtonCommandHandler = (
    interaction: MessageComponentInteraction,
  ) => Promise<void | TCache.Command>;

  type MessageCommandHandler = (interaction: Message) => Promise<void | TCache.Command>;

  type Command = {
    aliases?: string[];
    args?: boolean;
    data: TDiscord.SlashCommandData;
    execute: SlashCommandHandler;
    permissions?: string[];
    usage?: string;
    buttonHandler?: ButtonCommandHandler;
    messageHandler?: MessageCommandHandler;
  };

  type CommandData = Omit<Command, 'execute' | 'buttonHandler' | 'messageHandler'>;
}

export type { TBot };
