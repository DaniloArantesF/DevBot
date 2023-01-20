'use client';
import { createContext, useContext, useState } from 'react';
import { GuildData } from 'shared/types';

type DashboardProviderProps = {
  children: React.ReactNode;
};

interface DashboardContext {
  currentGuild: GuildData | null;
}

export const initialDashboardContext: DashboardContext = {
  currentGuild: null,
};

export const DashboardContext = createContext(initialDashboardContext);

export function DashboardProvider({ children }: DashboardProviderProps) {
  const [guild, setGuild] = useState<GuildData | null>(null);

  return (
    <DashboardContext.Provider
      value={{
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
