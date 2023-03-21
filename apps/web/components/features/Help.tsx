import type { TBot } from '@lib/types';
import classes from '@styles/Help.module.css';
import ScrollArea from '../primitives/ScrollArea';
import Separator from '../primitives/Separator';

interface HelpProps {
  commands: TBot.CommandData[];
}

interface CommandCardProps {
  command: TBot.CommandData;
}

function CommandCard({ command }: CommandCardProps) {
  return (
    <div className={classes.card}>
      <p>{command.data.name}</p>
      <Separator />
      <p>{command.data.description}</p>
      <div>{command.usage}</div>
    </div>
  );
}

function Help({ commands }: HelpProps) {
  return (
    <ScrollArea>
      {commands.map((command) => {
        return <CommandCard command={command} key={command.data.name} />;
      })}
    </ScrollArea>
  );
}

export default Help;
