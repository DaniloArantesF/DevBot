import Button from '@components/primitives/Button';
import ScrollArea from '@components/primitives/ScrollArea';
import Widget from '@components/ui/Widget';
import { useDashboardContext } from '@lib/context/dashboardContext';
import fetchJson from '@lib/fetch';
import { getCookie } from 'cookies-next';
import { useMemo, useRef, useState } from 'react';
import { PUBLIC_API_URL } from 'shared/config';
import utilClasses from '@styles/utils.module.css';

export async function dispatchRulesSetup(guildId: string, token: string) {
  try {
    const data = await fetchJson<{}>(`${PUBLIC_API_URL}/bot/${guildId}/setup/rules`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function dispatchRolesSetup(guildId: string, token: string) {
  try {
    const data = await fetchJson<{}>(`${PUBLIC_API_URL}/bot/${guildId}/setup/userRoles`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function dispatchRolePurge(guildId: string, token: string) {
  try {
    const data = await fetchJson<{}>(`${PUBLIC_API_URL}/bot/${guildId}/userRoles/purge`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function dispatchUserChannelPurge(guildId: string, token: string) {
  try {
    const data = await fetchJson<{}>(`${PUBLIC_API_URL}/bot/${guildId}/userChannels/purge`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
}

function MaintenancePanel() {
  const { currentGuild } = useDashboardContext();
  const token = useMemo(() => getCookie('token') as string, []);
  const taskHandlers = useMemo(
    () => [
      {
        label: 'Rules Setup',
        handler: dispatchRulesSetup,
      },
      {
        label: 'User Roles Setup',
        handler: dispatchRolesSetup,
      },
      {
        label: 'Purge User Roles',
        handler: dispatchRolePurge,
      },
      {
        label: 'Purge User Channels',
        handler: dispatchUserChannelPurge,
      },
      {
        label: 'Bot Channel Setup',
        handler: () => {},
      },
    ],
    [],
  );

  return (
    <Widget title={'Maintenance Tasks'}>
      <ScrollArea>
        <div className={utilClasses.flex_column}>
          {taskHandlers.map((task, index) => {
            return (
              <Button
                key={index}
                onClick={async () => {
                  if (currentGuild) {
                    await task.handler(currentGuild, token);
                  }
                }}
                style={{ width: '100%', cursor: 'pointer' }}
              >
                {task.label}
              </Button>
            );
          })}
        </div>
      </ScrollArea>
    </Widget>
  );
}

export default MaintenancePanel;
