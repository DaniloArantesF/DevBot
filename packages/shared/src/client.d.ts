declare namespace TClient {
  interface DashboardContext {
    commands: TBot.CommandData[];
    currentGuild: TBotApi.GuildData | null;
    guilds: TBotApi.GuildData[];
    modal: null | React.RefObject<HTMLDivElement>;
    user: TBotApi.UserData | null;

    settings: DashboardSettings;
    updateSettings: (settings: Partial<DashboardSettings>) => void;
  }

  type DashboardSettings = {
    theme: ThemeOption;
    notifications: boolean;
  };

  export type ThemeOption = 'light' | 'dark';
}

export type { TClient };
