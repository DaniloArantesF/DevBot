import React, { useMemo } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Cross2Icon, BellIcon } from '@radix-ui/react-icons';
import classes from '@styles/Notifications.module.css';
import ScrollArea from '@components/primitives/ScrollArea';
import Separator from '@components/primitives/Separator';

function Notifications() {
  const notifications = useMemo(
    () =>
      Array(10)
        .fill(0)
        .map((n) => `Notification ${n}`),
    [],
  );

  return (
    <div className={classes.root}>
      <Popover.Root>
        <Popover.Trigger asChild>
          <button className={classes.iconButton} aria-label="Notifications">
            <BellIcon width={'1.5rem'} height={'1.5rem'} />
            {notifications.length > 0 && (
              <span className={classes.iconCount}>{notifications.length}</span>
            )}
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className={classes.content}
            side={'right'}
            align={'end'}
            sideOffset={16}
            alignOffset={32}
          >
            <ScrollArea>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {notifications.map((_, index) => (
                  <>
                    <div key={index} className={classes.notification}>
                      {`Notification #${index}`}
                    </div>
                    <Separator />
                  </>
                ))}
              </div>
            </ScrollArea>
            <Popover.Close className={classes.closeButton} aria-label="Close">
              <Cross2Icon />
            </Popover.Close>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}

export default Notifications;
