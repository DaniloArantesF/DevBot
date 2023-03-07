import { getDiscordAvatar } from 'shared/utils';
import { useMemo } from 'react';
import AvatarList from './AvatarList';
import Button from './Button';
import Modal from './Modal';
import Help from './Help';
import Link from 'next/link';
import classes from '@styles/Sidebar.module.css';
import { useDashboardContext } from '@lib/context/dashboardContext';
import { deleteCookie } from 'cookies-next';
import { useRouter } from 'next/navigation';

function Sidebar() {
  const router = useRouter();
  const { guilds, commands } = useDashboardContext();
  const guildAvatars = useMemo(() => {
    return guilds.map((guild) => ({
      href: `/dashboard/${guild.id}`,
      src: getDiscordAvatar('guild', guild.id, guild.icon),
      alt: guild.name,
    }));
  }, [guilds]);

  function toggleHelp() {
    console.log('help');
  }

  function logout() {
    deleteCookie('accessToken');
    deleteCookie('refreshToken');
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
