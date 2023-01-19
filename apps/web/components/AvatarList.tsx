import * as ScrollArea from '@radix-ui/react-scroll-area';
import classes from '@styles/AvatarList.module.css';
import AvatarIcon from './Avatar';

interface AvatarListProps {
  direction?: 'row' | 'column';
  items: { src: string; alt: string }[];
}

function AvatarList({ items = [], direction = 'column' }: AvatarListProps) {
  return (
    <div className={classes.container}>
      <ScrollArea.Root className={classes.root}>
        <ScrollArea.Viewport className={classes.viewport}>
          <div>
            {items.map(({ alt, src }, index) => (
              <div key={index} className={classes.item}>
                <AvatarIcon src={src} alt={alt} />
              </div>
            ))}
          </div>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar className={classes.scrollbar} orientation="vertical">
          <ScrollArea.Thumb className={classes.thumb} />
        </ScrollArea.Scrollbar>
        <ScrollArea.Corner className={classes.corner} />
      </ScrollArea.Root>
    </div>
  );
}

export default AvatarList;
