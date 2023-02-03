export interface PbBase {
  id: string;
  created: string;
  updated: string;
}

export interface PbUserData extends PbBase {
  avatar: string;
  discordId: string;
  email: string;
  emailVisibility: boolean;
  username: string;
}

// aka server
export interface GuildData {
  guildId: string;
  name: string;
  plugins?: string[];
  rolesChannelId?: string;
  rolesMessageId?: string;
}

export interface ChallengeData extends PbBase {
  goal: string;
  startDate: string;
  user: string;
  status: string;
  participants: string[];
  duration: number; // in days
  guildId: string;
  period: number; // in days
  channelId: string;
  description?: string;
  endDate?: Date;
  inProgress?: boolean;
}

export interface ChallengeParticipantData {
  challengeId: string;
  userId: string;
  streak: number;
  lastUpdate: Date;
}
