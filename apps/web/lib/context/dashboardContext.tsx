'use client';
import { createContext, useContext, useState } from 'react';
import { DiscordCommandData, GuildData } from 'shared/types';

type DashboardProviderProps = {
  children: React.ReactNode;
};

interface DashboardContext {
  currentGuild: GuildData | null;
  modal: null | React.RefObject<HTMLDivElement>;
  commands: DiscordCommandData[];
}

export const initialDashboardContext: DashboardContext = {
  currentGuild: null,
  modal: null,
  commands: [],
};

export const DashboardContext = createContext(initialDashboardContext);

export function DashboardProvider({ children }: DashboardProviderProps) {
  const [guild, setGuild] = useState<GuildData | null>(null);

  return (
    <DashboardContext.Provider
      value={{
        ...initialDashboardContext,
        currentGuild: guild,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext() {
  return useContext(DashboardContext);
}
