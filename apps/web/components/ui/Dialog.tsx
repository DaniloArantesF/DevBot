import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Cross2Icon } from '@radix-ui/react-icons';
import Button from '../primitives/Button';
import classes from '@styles/Dialog.module.css';
import utilClasses from '@styles/utils.module.css';

interface DialogProps {
  children: React.ReactNode[] | React.ReactNode;
  description?: string;
  title: string;
  triggerLabel?: React.ReactNode;
}

function Dialog({ children, title, description, triggerLabel }: DialogProps) {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>
        <Button label={title} style={{ margin: '0' }}>
          {triggerLabel}
        </Button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={utilClasses.overlay} />
        <DialogPrimitive.Content className={classes.content}>
          <DialogPrimitive.Title className={classes.title}>{title}</DialogPrimitive.Title>
          {description && (
            <DialogPrimitive.Description className={classes.description}>
              {description}
            </DialogPrimitive.Description>
          )}
          <fieldset className={classes.fieldset}>{children}</fieldset>
          <div style={{ display: 'flex', marginTop: '1.5rem', justifyContent: 'flex-start' }}>
            <DialogPrimitive.Close asChild>
              <Button label="Save & Close" />
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Close asChild>
            <Button className={classes.close}>
              <Cross2Icon />
            </Button>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export default Dialog;
