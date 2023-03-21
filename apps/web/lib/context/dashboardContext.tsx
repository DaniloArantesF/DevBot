'use client';
import useAuth from '@lib/hooks/useAuth';
import useChannels from '@lib/hooks/useChannels';
import useCommands from '@lib/hooks/useCommands';
import useGuilds from '@lib/hooks/useGuilds';
import useUser from '@lib/hooks/useUser';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { TClient } from 'shared/types';

type DashboardProviderProps = {
  children: React.ReactNode;
};

export const defaultSettings: TClient.DashboardSettings = {
  theme: 'dark',
  notifications: false,
};

export const initialDashboardContext: TClient.DashboardContext = {
  commands: [],
  currentGuild: null,
  guilds: [],
  channels: [],
  modal: null,
  user: null,
  settings: defaultSettings,
  updateSettings: (settings) => {},
  setCurrentGuild: (guild) => {},
};

const DashboardContext = createContext(initialDashboardContext);
export function DashboardProvider({ children }: DashboardProviderProps) {
  const router = useRouter();
  const mounted = useRef(false);
  const [currentGuild, setCurrentGuild] = useState<string | null>(null);
  const auth = useAuth();
  const { guilds } = useGuilds();
  const { commands } = useCommands();
  const { user } = useUser();
  const [settings, setSettings] = useState<TClient.DashboardSettings>(defaultSettings);
  const { channels } = useChannels(currentGuild ?? null);

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
        currentGuild,
        setCurrentGuild,
        guilds: guilds || [],
        user: user || null,
        settings,
        updateSettings: (newSettings) =>
          setSettings((settings) => ({ ...settings, ...newSettings })),
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
