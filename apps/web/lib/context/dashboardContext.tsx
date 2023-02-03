'use client';
import useAuth from '@lib/hooks/useAuth';
import { createContext, useContext, useLayoutEffect, useState } from 'react';
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
  const auth = useAuth();

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
