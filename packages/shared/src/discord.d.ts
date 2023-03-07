import type {
  SlashCommandBuilder,
  Message as DiscordMessage,
  RoleData as DiscordRoleData,
} from 'discord.js';

declare namespace TDiscord {
  export type Message = DiscordMessage;

  // Serializable Data types
  export type SlashCommandData = Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'> &
    Partial<SlashCommandBuilder>;

  export type RoleData = DiscordRoleData;

  export type Reply = string | (MessagePayload | MessageReplyOptions) | InteractionReplyOptions
}

export type { TDiscord };
