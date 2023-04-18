import type Discord, {
  CommandInteraction,
  Message,
  MessageComponentInteraction,
  GuildChannel,
  ChannelType,
  PermissionsString,
  TextChannel,
  Message,
  Role,
  Colors,
  CategoryChannel,
} from 'discord.js';
import { TDiscord } from './discord';
import { TCache } from './cache';
import { TBotApi } from './api';
import { LogLevel } from './logger';

declare namespace TBot {
  type Config = {
    motherGuildId: string;
    prefix: string;
    logLevel: LogLevel;
    cooldownMs: number;
    autoProcess: boolean;
    autoSetup: boolean;
    loadPlugins: boolean;
    globalModerationConfig: {
      language: GuildConfigModerationRule;
      content: GuildConfigModerationRule;
    };
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
    isHidden?: boolean;
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

export type GuildConfigUserRole = Omit<TBotApi.RoleData, 'id' | 'guildId'> & {
  userAssignable: boolean;
};

export type GuildConfigModerationRule = {
  // type: string;
  enabled: boolean;
  allowed: string[];
  roleExceptions: string[];
};

export type GuildConfigChannel = {
  name: string;
  channelId?: number;
  entityId?: string; //
  description: string;
  type: number;
  subChannels?: {
    // only possible for category channels
    [key: string]: Omit<GuildConfigChannel, 'subChannels'>;
  };
  allowedRoles?: string[];
  permissionOverwrites?: { id: number; type: number; allow: string; deny: string }[];
  moderation?: {
    language: GuildConfigModerationRule;
    content: GuildConfigModerationRule;
  };
  flags?: string[];
  plugin?: string | null;
  parentId?: string | null;
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

// Entry per guild managed by the bot
export type GuildBotContext = {
  rulesChannel: Discord.GuildChannel | null;
  rulesMessage: Discord.Message | null;
  memberRole: Discord.Role | null;
  rolesCategory: Discord.CategoryChannel | null;
  roleUserChannels: Map<string, Discord.TextChannel>;

  // Category name -> category
  userChannelCategory: Map<string, Discord.CategoryChannel>;
  reactionChannels: Map<string, Discord.TextChannel>;

  roleEmojiMap: Map<string, string>; // emoji -> roleId

  // roleid -> role
  userRoles: Map<string, Discord.Role>;
  moderationConfig: {
    language: GuildConfigModerationRule;
    content: GuildConfigModerationRule;
  };

  logChannel: Discord.TextChannel | null;
};

export type ReactionHandler = (
  reaction: Discord.MessageReaction | Discord.PartialMessageReaction,
  user: Discord.User | Discord.PartialUser,
) => void;

declare namespace TGuildContext {
  // TODO
}

type GuildMemberSnapshot = {
  id: string;
  username: string;
  discriminator: string;
  roles: string[];
};

export type GuildSnapshot = GuildConfigExport & {
  guild: string;
  members: GuildMemberSnapshot[];
};

export type { TBot, TGuildContext };
