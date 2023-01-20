import { getDiscordAvatar } from '@lib/utils';
import classes from '@styles/Sidebar.module.css';
import { useMemo } from 'react';
import { GuildData } from '@lib/types';
import AvatarList from './AvatarList';
import Button from './Button';
import { logout } from '@api/auth/logout';

interface SidebarProps {
  guilds: GuildData[];
}

function Sidebar({ guilds }: SidebarProps) {
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
        <Button label="Help" type={'link'} onClick={toggleHelp} />
        <Button label="Logout" type={'link'} onClick={logout} />
      </div>
    </div>
  );
}

export default Sidebar;
