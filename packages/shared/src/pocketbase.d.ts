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
    allowedSubmissionTypes?: string[];
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
    submissionType: 'text' | 'url' | 'image' | 'commit';
    value: string;
  };

  type ChallengeCreateOptions = Omit<TPocketbase.ChallengeData, 'channelId' | 'status'>;

  export type Guild = GuildData & Base;
  export type Challenge = ChallengeData & Base;
  export type ChallengeParticipant = ChallengeParticipantData & Base;
  export type ChallengeSubmission = ChallengeSubmissionData & Base;
}

export { TPocketbase };
