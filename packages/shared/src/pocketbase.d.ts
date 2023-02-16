declare namespace TPocketbase {
  export type Base = {
    id: string;
    created: string;
    updated: string;
  };

  export type UserData = {
    avatar: string;
    discordId: string;
    email: string;
    emailVisibility: boolean;
    username: string;
  };

  // aka server
  export type GuildData = {
    guildId: string;
    name: string;
    plugins?: string[];
    rolesChannelId?: string;
    rolesMessageId?: string;
  };

  export type ChallengeData = {
    allowedSubmissionTypes?: string[];
    channelId: string;
    description?: string;
    duration: number; // in days
    endDate?: Date;
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

  export type ChallengeParticipantData = {
    challengeId: string;
    userId: string;
    streak: number;
    lastUpdate: Date;
  };

  export type ChallengeSubmissionData = {
    challenge: string;
    userId: string;
    type: 'text' | 'url' | 'image' | 'commit';
    value: string;
    day: number;
  };

  type ChallengeCreateOptions = Omit<TPocketbase.ChallengeData, 'channelId' | 'status' | 'roleId'>;

  export type Guild = GuildData & Base;
  export type Challenge = ChallengeData & Base;
  export type ChallengeParticipant = ChallengeParticipantData & Base;
  export type ChallengeSubmission = ChallengeSubmissionData & Base;
}

export { TPocketbase };
