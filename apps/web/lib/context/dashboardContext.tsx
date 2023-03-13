'use client';
import useAuth from '@lib/hooks/useAuth';
import useCommands from '@lib/hooks/useCommands';
import useGuilds from '@lib/hooks/useGuilds';
import useUser from '@lib/hooks/useUser';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { TBot, TBotApi } from 'shared/types';

type DashboardProviderProps = {
  children: React.ReactNode;
};

interface DashboardContext {
  commands: TBot.CommandData[];
  currentGuild: TBotApi.GuildData | null;
  guilds: TBotApi.GuildData[];
  modal: null | React.RefObject<HTMLDivElement>;
  user: TBotApi.UserData | null;
}

export const initialDashboardContext: DashboardContext = {
  commands: [],
  currentGuild: null,
  guilds: [],
  modal: null,
  user: null,
};

const DashboardContext = createContext(initialDashboardContext);
export function DashboardProvider({ children }: DashboardProviderProps) {
  const router = useRouter();
  const mounted = useRef(false);
  const [guild, setGuild] = useState<TBotApi.GuildData | null>(null);
  const auth = useAuth();
  const { guilds } = useGuilds();
  const { commands } = useCommands();
  const { user } = useUser();

  useEffect(() => {
    if (!mounted.current && !auth.isLogged) {
      redirectToLogin();
    }
    return () => {
      mounted.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function redirectToLogin() {
    router.replace('/login');
    router.refresh();
  }

  return (
    <DashboardContext.Provider
      value={{
        ...initialDashboardContext,
        commands: commands || [],
        currentGuild: guild,
        guilds: guilds || [],
        user: user || null,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext() {
  return useContext(DashboardContext);
}

export default DashboardContext;
