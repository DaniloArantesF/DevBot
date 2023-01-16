import * as ScrollArea from '@radix-ui/react-scroll-area';
import classes from '@styles/NavMenu.module.css';

const TAGS = Array.from({ length: 50 }).map((_, i, a) => `v1.2.0-beta.${a.length - i}`);

export default function NavMenu() {
  return (
    <div>
      <ScrollArea.Root className={classes.root}>
        <ScrollArea.Viewport className={classes.viewport}>
          <div>
            {TAGS.map((tag) => (
              <div key={tag}>{tag}</div>
            ))}
          </div>
        </ScrollArea.Viewport>

        {/* ------ */}
        <ScrollArea.Scrollbar className={classes.scrollbar} orientation="vertical">
          <ScrollArea.Thumb className={classes.thumb} />
        </ScrollArea.Scrollbar>

        <ScrollArea.Corner className={classes.corner} />
      </ScrollArea.Root>
    </div>
  );
}
