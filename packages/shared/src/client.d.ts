import { TBotApi } from './api';
import { TBot } from './bot';

declare namespace TClient {
  interface DashboardContext {
    commands: TBot.CommandData[];
    currentGuild: string | null;
    guilds: TBotApi.GuildData[];
    modal: null | React.RefObject<HTMLDivElement>;
    user: TBotApi.UserData | null;
    channels: TBotApi.ChannelData[];
    settings: DashboardSettings;
    updateSettings: (settings: Partial<DashboardSettings>) => void;
    setCurrentGuild: (guild: string) => void;
  }

  type DashboardSettings = {
    theme: ThemeOption;
    notifications: boolean;
  };

  type ThemeOption = 'light' | 'dark';
}

export type { TClient };
