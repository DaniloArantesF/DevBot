import { DiscordAuthResponse, TBotApi } from './api';
import {
  GuildBotContext,
  GuildConfigChannel,
  GuildConfigModerationRule,
  GuildSnapshot as TGuildSnapshot,
  TBot,
} from './bot';

declare namespace TPocketbase {
  type Base = {
    id: string;
    created: string;
    updated: string;
  };

  type AuthBase = Base & {
    username: string;
    email: string;
    emailVisibility: boolean;
    verified: boolean;
  };

  type UserData = {
    avatar: string;
    discordId: string;
    email: string;
    emailVisibility: boolean;
    username: string;
    isAdmin: boolean;
    discordAuth?: TBotApi.AuthData;
    discordUser?: TBotApi.UserData;
  };

  // aka server
  type GuildData = {
    guildId: string;
    name: string;
    plugins?: string[];
    userRoles: UserRoleItem[];
    userChannels: UserChannel[];

    // list of channels that are managed by the bot
    channels: GuildConfigChannel[];
    description?: string;
    memberRoleId?: string;
    rules?: string;
    managed: boolean;
    moderation: {
      language: GuildConfigModerationRule;
      content: GuildConfigModerationRule;
    };
  };

  type UserRoleItem = {
    name: string;
    entityId?: string;
    description: string;
    emoji: string;
    position: number;
    category: string;
    color?: string;
    hasChannel?: boolean;
    icon?: string;
  };

  type UserChannel = Omit<GuildConfigChannel, 'subChannels'> & {
    entityId?: string;
    parentId: string | null;
  };

  type GuildSnapshotData = TGuildSnapshot;

  type ChallengeData = {
    allowedSubmissionTypes?: string[];
    channelId: string;
    description?: string;
    duration: number; // in days
    endDate?: Date;
    currentPeriod: number;
    goal: string;
    guildId: string;
    roleId: string;
    inProgress?: boolean;
    lastCheck?: string | null; // Last routine check
    participants: string[];
    period: number; // in milliseconds
    startDate: string;
    status: string;
    user: string;
  };

  type ChallengeParticipantData = {
    challenge: string;
    userId: string;
    streak: number;
    lastUpdate?: string;
    sponsorId?: string;
    sponsorVerified?: boolean;
    followers?: string[];
    // TODO: sponsorNotificationFrequency?
  };

  type ChallengeSubmissionData = {
    challenge: string;
    userId: string;
    type: 'text' | 'url' | 'image' | 'commit';
    value: string;
    day: number;
  };

  type ChallengeCreateOptions = Omit<TPocketbase.ChallengeData, 'channelId' | 'status' | 'roleId'>;

  type PluginData = {
    name: string;
    description: string;
  };

  type User = AuthBase & UserData;
  type Guild = GuildData & Base;
  type Challenge = ChallengeData & Base;
  type ChallengeParticipant = ChallengeParticipantData & Base;
  type ChallengeSubmission = ChallengeSubmissionData & Base;
  type Plugin = Base & PluginData;
  type GuildSnapshot = GuildSnapshotData & Base;
}

export { TPocketbase };
