import { getDiscordAvatar } from 'shared/utils';
import { useMemo } from 'react';
import AvatarList from '@components/ui/AvatarList';
import Button from '@components/primitives/Button';
import Modal from '@components/ui/Modal';
import Help from '@components/features/Help';
import Link from 'next/link';
import classes from '@styles/Sidebar.module.css';
import { useDashboardContext } from '@lib/context/dashboardContext';
import { deleteCookie } from 'cookies-next';
import { useRouter } from 'next/navigation';
import Notifications from '@components/features/Notifications';

function Sidebar() {
  const router = useRouter();
  const { guilds, commands } = useDashboardContext();
  const guildAvatars = useMemo(
    () =>
      guilds.map((guild) => ({
        href: `/dashboard/${guild.id}`,
        ...(guild.icon && { src: getDiscordAvatar('guild', guild.id, guild.icon) }),
        alt: guild.name,
      })),
    [guilds],
  );

  function toggleHelp() {
    console.log('help');
  }

  function logout() {
    deleteCookie('token');
    deleteCookie('expiresAt');
    document.cookie = '';
    localStorage.clear();
    router.replace('/login');
    router.refresh();
  }

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <Link id={classes.logo} href="/dashboard">
          Bot Logo
        </Link>
      </div>

      <div className={classes.body}>
        <AvatarList items={guildAvatars} />
      </div>

      <div className={classes.footer}>
        <Notifications />
        <Modal
          heading="Help"
          description="Currently available commands"
          btn={{
            label: 'Help',
            type: 'link',
            style: { textTransform: 'uppercase' },
            onClick: toggleHelp,
          }}
        >
          <Help commands={commands} />
        </Modal>
        <Button
          label="Logout"
          type={'link'}
          onClick={() => logout()}
          style={{ textTransform: 'uppercase' }}
        />
      </div>
    </div>
  );
}

export default Sidebar;
