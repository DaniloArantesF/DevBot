import { getDiscordAvatar } from '@lib/utils';
import classes from '@styles/Sidebar.module.css';
import { useMemo } from 'react';
import { GuildData } from 'types';
import AvatarList from './AvatarList';
import Button from './Button';

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

  function logout() {
    console.log('logout');
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
