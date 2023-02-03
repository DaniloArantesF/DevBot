/* -------------------------------- */
/*            Shared Types          */
/* -------------------------------- */
export * from './discord';

// Pocketbase types

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

export interface ChallangeData extends PbBase {
  channelId: string;
  description: string;
  endDate: Date;
  inProgress: boolean;
  participants: string[];
  period: number; // in days
  startDate: Date;
  title: string;
  user: string;
}

export interface ChallangeParticipantData {
  challangeId: string;
  userId: string;
  streak: number;
  lastUpdate: Date;
}
