import classes from '@styles/UserCard.module.css';
import AvatarIcon from '../primitives/Avatar';
import { useDashboardContext } from '@lib/context/dashboardContext';
import DropdownMenu, {
  DropdownMenuCheckbox,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownRadioGroup,
} from '../ui/DropdownMenu';
import { getDiscordAvatar } from 'shared/utils';
import { TClient } from 'shared/types';
import { useMemo } from 'react';

function UserCard() {
  const { user, settings, updateSettings } = useDashboardContext();
  const themeOptions = useMemo(
    () => ['dark', 'light'].map((o) => ({ value: o, label: o, default: settings.theme === o })),
    [settings],
  );

  function clearNotifications() {
    console.log('clear');
  }

  return (
    user && (
      <div className={classes.root}>
        <AvatarIcon src={getDiscordAvatar('user', user!.id, user!.avatar)} alt={user!.username} />
        <div className={classes.info}>
          <div>{user?.username}</div>
          <div>#{user?.discriminator}</div>
        </div>
        <div className={classes.options}>
          <DropdownMenu>
            <DropdownMenuCheckbox
              label={'Enable notifications'}
              onChange={(value) => updateSettings({ notifications: value })}
              checked={settings.notifications ?? false}
            />
            <DropdownMenuItem label={'Clear notifications'} onClick={() => clearNotifications()} />
            <DropdownMenuSeparator />
            <DropdownMenuLabel label={'Theme'} />
            <DropdownRadioGroup
              onChange={(value) => updateSettings({ theme: value as TClient.ThemeOption })}
              options={themeOptions}
            />
          </DropdownMenu>
        </div>
      </div>
    )
  );
}

export default UserCard;
