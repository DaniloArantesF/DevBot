import type { CommandInteraction, Message, MessageComponentInteraction } from 'discord.js';
import { TDiscord } from './discord';
import { TCache } from './cache';

declare namespace TBot {
  type LogLevel = 'debug' | 'minimal';

  type Config = {
    prefix: string;
    logLevel: 'debug' | 'minimal';
    cooldownMs: number;
    autoProcess: boolean;
  };

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

  // TODO: use this
  type PluginController = {
    id: string;
    setup: () => Promise<void>;
    setupApi?: () => Promise<void>;
    setStatus: (guildId: string, status: boolean) => Promise<void>;
    getStatus: (guildId: string) => Promise<boolean>;
  };
}

export type GuildConfigUserRole = {
  color: number;
  hoist: boolean;
  icon: string | null;
  mentionable: boolean;
  name: string;
  permissions: PermissionsString[];
  unicodeEmoji: string | null;
  // premiumSubscriber: boolean;
  managed: boolean;
  userAssignable: boolean;
};

export type GuildConfigModerationRule = {
  enabled: boolean;
  allowed: string[];
  roleExceptions: string[];
};

export type GuildConfigChannel = {
  name: string;
  description: string;
  type: string; // improve this
  subChannels: {
    // only possible for category channels
    [key: string]: Omit<GuildConfigChannel, 'subChannels'>;
  };
  allowedRoles: string[];
  moderation: {
    language: GuildConfigModerationRule;
    content: GuildConfigModerationRule;
  };
  flags: string[];
  plugin: string | null;
};

export type ConfigCollection<V> = {
  [key: string]: V;
};

export type GuildConfigExport = {
  roles: ConfigCollection<GuildConfigUserRole>;
  rules: {
    channelName: string;
    message: string;
  };
  channels: {
    [key: number]: GuildConfigChannel;
  };
  plugins: string[]; // ??
};

export type { TBot };
