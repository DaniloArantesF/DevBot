import type { Command } from '@lib/types';
import classes from '@styles/Help.module.css';
import Separator from './Separator';

interface HelpProps {
  commands: Command[];
}

interface CommandCardProps {
  command: Command;
}

function CommandCard({ command }: CommandCardProps) {

  return (
    <div className={classes.card}>
      <p>{command.data.name}</p>
      <Separator />
      <p>{command.data.description}</p>
      <div>
        {  command.usage }
      </div>
    </div>
  );
}

function Help({ commands }: HelpProps) {

  return (
    <div>
      {
        commands.map((command) => {
          return <CommandCard command={command} key={command.data.name} />;
        })

      }
    </div>
  );
}

export default Help;