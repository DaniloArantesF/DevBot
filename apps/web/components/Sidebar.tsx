import { getDiscordAvatar } from '@lib/utils';
import classes from '@styles/Sidebar.module.css';
import { useMemo } from 'react';
import { Command, GuildData } from '@lib/types';
import AvatarList from './AvatarList';
import Button from './Button';
import { logout } from '@api/auth/logout';
import Modal from './Modal';
import Help from './Help';

interface SidebarProps {
  guilds: GuildData[];
  commands: Command[];
}

function Sidebar({ guilds, commands }: SidebarProps) {
  const guildAvatars = useMemo(() => {
    return guilds.map((guild) => ({
      src: getDiscordAvatar('guild', guild.id, guild.icon),
      alt: guild.name,
    }));
  }, [guilds]);

  function toggleHelp() {
    console.log('help');
  }

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <span id={classes.logo}>Bot Logo</span>
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
          onClick={logout}
          style={{ textTransform: 'uppercase' }}
        />
      </div>
    </div>
  );
}

export default Sidebar;
